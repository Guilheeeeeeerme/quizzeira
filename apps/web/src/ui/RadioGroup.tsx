import { createContext, useContext, type ReactNode } from "react";
import styles from "./RadioGroup.module.css";

interface RadioGroupContextValue {
  name: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export function RadioGroup({
  name,
  value,
  onChange,
  disabled,
  label,
  children,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.group} role="radiogroup" aria-label={label}>
      <RadioGroupContext.Provider value={{ name, value, onChange, disabled }}>
        {children}
      </RadioGroupContext.Provider>
    </div>
  );
}

export function RadioItem({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) throw new Error("RadioItem must be used within RadioGroup");

  const id = `${ctx.name}-${value}`;
  const checked = ctx.value === value;

  return (
    <label className={[styles.item, checked ? styles.checked : ""].filter(Boolean).join(" ")} htmlFor={id}>
      <input
        id={id}
        className={styles.input}
        type="radio"
        name={ctx.name}
        value={value}
        checked={checked}
        disabled={ctx.disabled}
        onChange={() => ctx.onChange(value)}
      />
      <span className={styles.indicator} aria-hidden />
      <span className={styles.text}>{children}</span>
    </label>
  );
}
