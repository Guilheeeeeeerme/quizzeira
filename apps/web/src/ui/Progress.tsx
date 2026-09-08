import styles from "./Progress.module.css";

export function Progress({
  value,
  max = 100,
  label,
}: {
  value: number;
  max?: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(value, max));
  const pct = max === 0 ? 0 : (clamped / max) * 100;

  return (
    <div
      className={styles.root}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      aria-label={label}
    >
      <div className={styles.track}>
        <div className={styles.range} style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
    </div>
  );
}
