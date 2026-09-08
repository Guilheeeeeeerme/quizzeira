import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import styles from "./Stack.module.css";

type Gap = 1 | 2 | 3 | 4 | 5 | 6 | 8;

const gapVar: Record<Gap, string> = {
  1: "var(--space-1-25)",
  2: "var(--space-2)",
  3: "var(--space-3)",
  4: "var(--space-4)",
  5: "var(--space-5)",
  6: "var(--space-6)",
  8: "var(--space-8)",
};

export function Stack({
  gap = 4,
  direction = "column",
  align,
  justify,
  className,
  children,
  style,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  gap?: Gap;
  direction?: "column" | "row";
  align?: CSSProperties["alignItems"];
  justify?: CSSProperties["justifyContent"];
  children: ReactNode;
}) {
  return (
    <div
      className={[styles.root, styles[direction], className ?? ""].filter(Boolean).join(" ")}
      style={{ gap: gapVar[gap], alignItems: align, justifyContent: justify, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Grid({
  columns = 3,
  gap = 4,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  columns?: 1 | 2 | 3;
  gap?: Gap;
  children: ReactNode;
}) {
  return (
    <div
      className={[styles.grid, styles[`cols${columns}`], className ?? ""].filter(Boolean).join(" ")}
      style={{ gap: gapVar[gap] }}
      {...rest}
    >
      {children}
    </div>
  );
}
