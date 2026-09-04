"""Sequences as files.

A sequence is a folder `outbound/<app>/sequences/<name>/` holding exactly:

    01-initial.md  02-followup.md  03-followup.md  04-breakup.md

Each file starts with YAML-like front matter and then the body:

    ---
    subject: A question about {{org.name}} and certified payroll
    delay_days: 0
    send_window: 09:00-11:00
    ---
    Hello,

    {{fact.opening}}.
    {{#if fact.federal_awards}}That usually means weekly WH-347s.{{/if}}

The renderer fails loudly on a missing variable: an email with a blank in it
is worse than no email, so `MissingVariable` stops the batch.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from outbound.engine import config as cfg_mod

STEP_FILES = ("01-initial.md", "02-followup.md", "03-followup.md", "04-breakup.md")
STEP_KINDS = ("initial", "followup", "followup", "breakup")

#: Delays used when a step file omits `delay_days`.
DEFAULT_DELAYS = (0, 5, 12, 21)

_IF_BLOCK = re.compile(
    r"\{\{#if\s+([A-Za-z0-9_.]+)\s*\}\}"
    r"((?:(?!\{\{#if\b)(?!\{\{/if\}\}).)*?)"
    r"\{\{/if\}\}",
    re.DOTALL,
)
_VARIABLE = re.compile(r"\{\{\s*([A-Za-z0-9_.]+)\s*\}\}")


class SequenceError(RuntimeError):
    pass


class MissingVariable(SequenceError):
    """Raised when a template references something the context does not hold."""

    def __init__(self, name: str, where: str = ""):
        self.name = name
        self.where = where
        super().__init__(f"missing template variable {{{{{name}}}}}"
                         + (f" in {where}" if where else ""))


@dataclass(frozen=True)
class Step:
    index: int          # 1-4
    kind: str           # initial | followup | breakup
    filename: str
    subject: str
    delay_days: int
    send_window: str
    body: str
    path: Path


@dataclass(frozen=True)
class Sequence:
    name: str
    app: str
    path: Path
    steps: tuple


def parse_front_matter(text: str) -> tuple[dict, str]:
    """Split `---` front matter from the body. Values stay strings unless numeric."""
    lines = text.replace("\r\n", "\n").split("\n")
    if not lines or lines[0].strip() != "---":
        return {}, text
    meta, index = {}, 1
    while index < len(lines) and lines[index].strip() != "---":
        line = lines[index]
        index += 1
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        key, sep, value = line.partition(":")
        if not sep:
            raise SequenceError(f"bad front-matter line: {line!r}")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if re.fullmatch(r"-?\d+", value):
            meta[key] = int(value)
        elif value.lower() in ("true", "false"):
            meta[key] = value.lower() == "true"
        else:
            meta[key] = value
    if index >= len(lines):
        raise SequenceError("front matter is not closed with ---")
    return meta, "\n".join(lines[index + 1:]).lstrip("\n")


def load_step(path: Path, index: int, default_window: str) -> Step:
    meta, body = parse_front_matter(Path(path).read_text(encoding="utf-8"))
    subject = str(meta.get("subject", "")).strip()
    if not subject:
        raise SequenceError(f"{path} has no subject in its front matter")
    if not body.strip():
        raise SequenceError(f"{path} has an empty body")
    return Step(
        index=index,
        kind=STEP_KINDS[index - 1],
        filename=Path(path).name,
        subject=subject,
        delay_days=int(meta.get("delay_days", DEFAULT_DELAYS[index - 1])),
        send_window=str(meta.get("send_window", default_window)),
        body=body,
        path=Path(path),
    )


def load_sequence(app: str, name: str, config: dict | None = None) -> Sequence:
    config = config or cfg_mod.load_config(app)
    path = cfg_mod.sequences_dir(app) / name
    if not path.is_dir():
        raise SequenceError(f"sequence not found: {path}")
    steps = []
    for index, filename in enumerate(STEP_FILES, start=1):
        step_path = path / filename
        if not step_path.exists():
            raise SequenceError(f"sequence {name} is missing {filename}")
        steps.append(load_step(step_path, index, config.get("send_window", "09:00-11:00")))
    return Sequence(name=name, app=app, path=path, steps=tuple(steps))


def list_sequences(app: str) -> list:
    root = cfg_mod.sequences_dir(app)
    if not root.is_dir():
        return []
    return sorted(p.name for p in root.iterdir()
                  if p.is_dir() and (p / STEP_FILES[0]).exists())


def sequence_for(config: dict, row: dict) -> str:
    """Pick a sequence for a workbook row: segment map first, default after."""
    segment = (row.get("segment") or "").lower()
    for needle, name in (config.get("sequence_map") or {}).items():
        if needle.lower() in segment:
            return name
    return config.get("default_sequence", "plain-intro")


# --------------------------------------------------------------------------
# rendering
# --------------------------------------------------------------------------

def lookup(context: dict, dotted: str):
    """Dotted lookup; returns None when any part of the path is absent."""
    node = context
    for part in dotted.split("."):
        if isinstance(node, dict) and part in node:
            node = node[part]
        else:
            return None
    return node


def _truthy(value) -> bool:
    if value is None or value is False:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, tuple, dict, set)):
        return bool(value)
    return True


def _resolve_conditionals(text: str, context: dict) -> str:
    previous = None
    while previous != text:
        previous = text
        text = _IF_BLOCK.sub(
            lambda m: m.group(2) if _truthy(lookup(context, m.group(1))) else "",
            text,
        )
    return text


def tidy(text: str) -> str:
    """Remove the holes a removed conditional leaves behind."""
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip("\n")


def render(template: str, context: dict, where: str = "") -> str:
    """Render one template. Raises MissingVariable rather than leave a blank."""
    text = _resolve_conditionals(template, context)
    missing = []

    def substitute(match):
        name = match.group(1)
        value = lookup(context, name)
        if value is None or (isinstance(value, str) and not value.strip()):
            missing.append(name)
            return match.group(0)
        if isinstance(value, (list, tuple)):
            return ", ".join(str(v) for v in value)
        return str(value)

    text = _VARIABLE.sub(substitute, text)
    if missing:
        raise MissingVariable(missing[0], where)
    if "{{" in text or "}}" in text:
        raise SequenceError(f"unresolved template syntax in {where or 'template'}")
    return tidy(text)


def render_step(step: Step, context: dict) -> tuple[str, str]:
    """(subject, body) for one step of one organisation."""
    where = f"{step.path.parent.name}/{step.filename}"
    subject = render(step.subject, context, where + " (subject)")
    body = render(step.body, context, where)
    return subject.strip(), body
