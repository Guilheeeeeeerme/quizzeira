import type { ReactNode } from "react";
import { Text } from "./Typography";
import styles from "./EmptyState.module.css";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.root}>
      <Text size="bodySm" tone="secondary" className={styles.title}>
        {title}
      </Text>
      {description ? (
        <Text size="caption" tone="tertiary">
          {description}
        </Text>
      ) : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
