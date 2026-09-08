import type { AttemptStatus } from "@quizzeira/shared";
import { useT } from "../i18n";
import { Badge, type BadgeTone } from "./Badge";

const statusTone: Record<AttemptStatus, BadgeTone> = {
  GENERATING: "accent",
  IN_PROGRESS: "neutral",
  PENDING: "warning",
  IN_CORRECTION: "accent",
  CORRECTED: "success",
};

const statusKey: Record<AttemptStatus, string> = {
  GENERATING: "Generating",
  IN_PROGRESS: "In progress",
  PENDING: "Pending",
  IN_CORRECTION: "In correction",
  CORRECTED: "Corrected",
};

export function StatusBadge({ status }: { status: AttemptStatus | string }) {
  const t = useT();
  const key = status as AttemptStatus;
  const tone = statusTone[key] ?? "neutral";
  const label = statusKey[key] ? t(statusKey[key]) : status;
  return <Badge tone={tone}>{label}</Badge>;
}
