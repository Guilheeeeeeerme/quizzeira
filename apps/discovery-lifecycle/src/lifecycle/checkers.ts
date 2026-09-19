import type { RegistrationStatus } from "./phases.js";

/**
 * Pluggable registration OPEN/CLOSED checkers.
 * Prefer crawler outputs (statusSource date/regex/llm) when available.
 */

export interface RegistrationSignal {
  status: RegistrationStatus;
  source: "date" | "regex" | "llm" | "admin" | "crawler" | "none";
  registrationStart?: Date | null;
  registrationEnd?: Date | null;
}

export interface RegistrationChecker {
  readonly name: string;
  check(input: {
    now: Date;
    registrationStart?: Date | null;
    registrationEnd?: Date | null;
    crawlerStatus?: RegistrationStatus | null;
    statusSource?: string | null;
  }): RegistrationSignal | null;
}

/** Date-window checker: OPEN iff now ∈ [start?, end]. Spec §11 / open detection. */
export const dateWindowChecker: RegistrationChecker = {
  name: "date_window",
  check({ now, registrationStart, registrationEnd }) {
    if (!registrationEnd) return null;
    if (registrationStart && now.getTime() < registrationStart.getTime()) {
      return {
        status: "unknown",
        source: "date",
        registrationStart,
        registrationEnd,
      };
    }
    if (now.getTime() <= registrationEnd.getTime()) {
      return {
        status: "open",
        source: "date",
        registrationStart,
        registrationEnd,
      };
    }
    return {
      status: "closed",
      source: "date",
      registrationStart,
      registrationEnd,
    };
  },
};

/** Reuse crawler Exam.status when statusSource is present. */
export const crawlerOutputChecker: RegistrationChecker = {
  name: "crawler_output",
  check({ crawlerStatus, statusSource, registrationStart, registrationEnd }) {
    if (!crawlerStatus || crawlerStatus === "unknown") return null;
    if (!statusSource) return null;
    return {
      status: crawlerStatus,
      source: "crawler",
      registrationStart,
      registrationEnd,
    };
  },
};

export const DEFAULT_CHECKERS: RegistrationChecker[] = [
  dateWindowChecker,
  crawlerOutputChecker,
];

/** First non-null checker wins (date before crawler regex). */
export function runCheckers(
  checkers: RegistrationChecker[],
  input: Parameters<RegistrationChecker["check"]>[0],
): RegistrationSignal {
  for (const checker of checkers) {
    const signal = checker.check(input);
    if (signal) return signal;
  }
  return {
    status: input.crawlerStatus ?? "unknown",
    source: "none",
    registrationStart: input.registrationStart,
    registrationEnd: input.registrationEnd,
  };
}
