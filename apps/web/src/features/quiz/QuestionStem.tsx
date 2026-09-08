import styles from "./QuestionStem.module.css";

/** Render stem text with paragraph breaks (no duplicated choice lists). */
export function QuestionStem({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  return (
    <div className={styles.stem}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={styles.paragraph}>
          {paragraph.split("\n").map((line, lineIndex, arr) => (
            <span key={lineIndex}>
              {line}
              {lineIndex < arr.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}
