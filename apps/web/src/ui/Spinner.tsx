import styles from "./Spinner.module.css";

export function Spinner({
  size = "md",
  label = "Loading",
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  return (
    <span
      className={[styles.root, styles[size]].join(" ")}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className={styles.visual} aria-hidden />
    </span>
  );
}
