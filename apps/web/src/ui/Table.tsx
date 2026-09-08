import type { ReactNode } from "react";
import styles from "./Table.module.css";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className={styles.thead}>{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TR({ children }: { children: ReactNode }) {
  return <tr className={styles.row}>{children}</tr>;
}

export function TH({ children }: { children?: ReactNode }) {
  return <th className={styles.th}>{children}</th>;
}

export function TD({ children, numeric }: { children?: ReactNode; numeric?: boolean }) {
  return <td className={[styles.td, numeric ? styles.numeric : ""].filter(Boolean).join(" ")}>{children}</td>;
}
