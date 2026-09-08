import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Surface.module.css";

type SurfaceTone = "raised" | "overlay" | "base";

export function Surface({
  tone = "raised",
  padded = true,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  tone?: SurfaceTone;
  padded?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={[styles.root, styles[tone], padded ? styles.padded : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
