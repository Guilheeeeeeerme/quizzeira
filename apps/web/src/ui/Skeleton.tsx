import styles from "./Skeleton.module.css";

export function Skeleton({
  width = "100%",
  height = 16,
  radius = "sm",
}: {
  width?: number | string;
  height?: number | string;
  radius?: "sm" | "md";
}) {
  return (
    <span
      className={[styles.root, styles[radius]].join(" ")}
      style={{ width, height }}
      aria-hidden
    />
  );
}

export function PageSkeleton() {
  return (
    <div className={styles.page} role="status" aria-label="Loading">
      <Skeleton height={28} width="40%" />
      <Skeleton height={16} width="70%" />
      <div className={styles.grid}>
        <Skeleton height={120} radius="md" />
        <Skeleton height={120} radius="md" />
        <Skeleton height={120} radius="md" />
      </div>
    </div>
  );
}
