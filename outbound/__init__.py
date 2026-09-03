"""Outbound: the founder's own cold-email system (no external sequencing tool).

Phase 4, decision D4. Everything here is drafts-first: nothing is sent by an
agent, and the live send adapter refuses to run unless the founder has set
OUTBOUND_SEND_ENABLED=true in their own environment.
"""
