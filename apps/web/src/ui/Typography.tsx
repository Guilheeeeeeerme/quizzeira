import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Typography.module.css";

export function Heading({
  level = 1,
  size,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement> & {
  level?: 1 | 2 | 3;
  size?: "display" | "page" | "section" | "card";
  children: ReactNode;
}) {
  const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
  const visual = size ?? (level === 1 ? "page" : level === 2 ? "section" : "card");
  return (
    <Tag className={[styles.heading, styles[visual], className ?? ""].filter(Boolean).join(" ")} {...rest}>
      {children}
    </Tag>
  );
}

export function Text({
  tone = "primary",
  size = "body",
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLParagraphElement> & {
  tone?: "primary" | "secondary" | "tertiary" | "danger";
  size?: "body" | "bodySm" | "caption" | "label";
  children: ReactNode;
}) {
  return (
    <p
      className={[styles.text, styles[tone], styles[size], className ?? ""].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </p>
  );
}
