import type { QuestionMediaRef } from "@quizzeira/shared";
import { isAllowedMediaUrl } from "@quizzeira/shared";
import styles from "./QuestionMedia.module.css";

export function QuestionMedia({
  items,
  size = "md",
}: {
  items: QuestionMediaRef[] | null | undefined;
  size?: "sm" | "md";
}) {
  if (!items?.length) return null;
  const safe = items.filter((item) => isAllowedMediaUrl(item.url));
  if (!safe.length) return null;
  return (
    <div className={[styles.gallery, size === "sm" ? styles.sm : ""].filter(Boolean).join(" ")}>
      {safe.map((item) => (
        <figure key={item.url} className={styles.figure}>
          <a href={item.url} target="_blank" rel="noreferrer noopener" className={styles.link}>
            <img
              className={styles.image}
              src={item.url}
              alt={item.alt?.trim() || "Question figure"}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </a>
          {item.alt ? <figcaption className={styles.caption}>{item.alt}</figcaption> : null}
        </figure>
      ))}
    </div>
  );
}
