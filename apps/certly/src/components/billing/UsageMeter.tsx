/**
 * The meter, drawn — "34 of 50 tracked vendors" (`specs/10` §6).
 *
 * It is a bar rather than a number because the question a customer actually has
 * at renewal is "am I close?", and because the answer has to be legible before
 * the invoice rather than after it. Over-limit is drawn as a full bar with the
 * overshoot NAMED: nothing is ever deleted for being over-limit (§9), so the
 * honest picture is "full, plus N you keep".
 */

export type UsageMeterProps = {
  used: number;
  limit: number;
  /** "tracked vendors", "seats". Plural, lower case. */
  unit: string;
  testId?: string;
};

export function UsageMeter({ used, limit, unit, testId }: UsageMeterProps) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const over = Math.max(0, used - limit);
  return (
    <div className="c-meter" data-testid={testId ?? 'usage-meter'}>
      <p className="c-meter__label">
        <strong className="c-num">{used}</strong> of <span className="c-num">{limit}</span> {unit}
        {over > 0 ? <span className="c-meter__over"> · {over} over the limit, and kept</span> : null}
      </p>
      <div
        className="c-meter__track"
        role="img"
        aria-label={`${used} of ${limit} ${unit} used`}
      >
        <div className={`c-meter__fill${over > 0 ? ' c-meter__fill--over' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
