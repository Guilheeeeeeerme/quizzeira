/**
 * Structured JSON logs for the infra Loki hub (24h retention).
 * Prefer ids/status over bodies; never log secrets or INTERNAL_API_KEY values.
 */
export type LogFields = Record<string, unknown>;

const serviceFromEnv = (): string =>
  process.env.SERVICE_NAME?.trim() || "quizzeira";

export function logInfo(message: string, fields: LogFields = {}): void {
  write("INFO", message, fields);
}

export function logWarn(message: string, fields: LogFields = {}): void {
  write("WARN", message, fields);
}

export function logError(message: string, fields: LogFields = {}): void {
  write("ERROR", message, fields, true);
}

function write(
  level: string,
  message: string,
  fields: LogFields,
  stderr = false,
): void {
  const payload: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    service: serviceFromEnv(),
    message,
    ...sanitize(fields),
  };
  const line = `${JSON.stringify(payload)}\n`;
  if (stderr) process.stderr.write(line);
  else process.stdout.write(line);
}

function sanitize(fields: LogFields): LogFields {
  const out: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    const lower = key.toLowerCase();
    if (
      lower.includes("password") ||
      lower.includes("secret") ||
      lower.includes("token") ||
      lower.includes("authorization") ||
      lower.includes("api_key") ||
      lower.includes("apikey")
    ) {
      out[key] = "[redacted]";
      continue;
    }
    if (value instanceof Error) {
      out[key] = value.message;
      continue;
    }
    out[key] = value;
  }
  return out;
}
