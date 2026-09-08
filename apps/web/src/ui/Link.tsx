import { Link as RouterLink, type LinkProps as RouterLinkProps } from "react-router-dom";
import styles from "./Link.module.css";

export function TextLink({ className, ...rest }: RouterLinkProps) {
  return <RouterLink className={[styles.link, className ?? ""].filter(Boolean).join(" ")} {...rest} />;
}

export function InlineLink({ className, ...rest }: RouterLinkProps) {
  return <RouterLink className={[styles.inline, className ?? ""].filter(Boolean).join(" ")} {...rest} />;
}
