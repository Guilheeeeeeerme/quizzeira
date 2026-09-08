import type { QuestionMediaRef } from "@quizzeira/shared";
import styles from "./QuestionMedia.module.css";

export function QuestionMedia({
  items,
  size = "md",
}: {
  items: QuestionMediaRef[] | null | undefined;
  size?: "sm" | "md";
}) {
  if (!items?.length) return null;
  return (
    <div className={[styles.gallery, size === "sm" ? styles.sm : ""].filter(Boolean).join(" ")}>
      {items.map((item) => (
        <figure key={item.url} className={styles.figure}>
          <a href={item.url} target="_blank" rel="noreferrer" className={styles.link}>
            <img
              className={styles.image}
              src={item.url}
              alt={item.alt?.trim() || "Question figure"}
              loading="lazy"
            />
          </a>
          {item.alt ? <figcaption className={styles.caption}>{item.alt}</figcaption> : null}
        </figure>
      ))}
    </div>
  );
}
