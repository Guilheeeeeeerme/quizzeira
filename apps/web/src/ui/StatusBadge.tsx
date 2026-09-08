import type { AttemptStatus } from "@quizzeira/shared";
import { Badge, type BadgeTone } from "./Badge";

const statusTone: Record<AttemptStatus, BadgeTone> = {
  IN_PROGRESS: "neutral",
  PENDING: "warning",
  IN_CORRECTION: "accent",
  CORRECTED: "success",
};

export function StatusBadge({ status }: { status: AttemptStatus | string }) {
  const tone = statusTone[status as AttemptStatus] ?? "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}
