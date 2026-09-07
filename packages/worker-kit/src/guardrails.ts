import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { load as loadYaml } from "js-yaml";
import { llmError } from "./errors";

export interface GuardrailPrompt {
  id: string;
  purpose?: string;
  variables: string[];
  template: string;
}

export interface GuardrailPolicyInput {
  id: string;
  description?: string;
  pattern: string;
  flags?: string;
  action: "block";
}

export interface CompiledPolicy {
  id: string;
  action: "block";
  test(value: string): boolean;
}

export interface GuardrailRegistry {
  version: 1;
  prompts: GuardrailPrompt[];
  policies: GuardrailPolicyInput[];
}

interface ParsedRegistry {
  prompts: Map<string, GuardrailPrompt>;
  policies: CompiledPolicy[];
}

let cachedRegistry: ParsedRegistry | undefined;

function registryPath(): string {
  const candidates = [
    resolve(__dirname, "..", "guardrails", "registry.yml"),
    resolve(process.cwd(), "guardrails", "registry.yml"),
    resolve(process.cwd(), "packages", "worker-kit", "guardrails", "registry.yml"),
  ];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) {
    throw new Error(`Guardrail registry not found. Tried: ${candidates.join(", ")}`);
  }
  return path;
}

function assertMapping(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a mapping`);
  }
  return value as Record<string, unknown>;
}

function assertNoUnknownFields(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      throw new Error(`${label} declares unknown field: ${key}`);
    }
  }
}

function compilePolicy(input: GuardrailPolicyInput): CompiledPolicy {
  const regex = new RegExp(input.pattern, input.flags ?? "i");
  if (!(regex instanceof RegExp)) {
    throw new Error(`Guardrail policy ${input.id} did not compile to a RegExp`);
  }
  if (regex.source === "") {
    throw new Error(`Guardrail policy ${input.id} has an empty pattern`);
  }
  return {
    id: input.id,
    action: "block",
    test: (value: string) => regex.test(value),
  };
}

export function parseRegistryDocument(input: unknown): ParsedRegistry {
  const doc = assertMapping(input, "Guardrail registry");
  assertNoUnknownFields(doc, ["version", "prompts", "policies"], "Guardrail registry");
  if (doc.version !== 1) {
    throw new Error("Guardrail registry must declare version: 1");
  }
  if (!Array.isArray(doc.prompts) || !Array.isArray(doc.policies)) {
    throw new Error("Guardrail registry must list prompts and policies");
  }

  const prompts = new Map<string, GuardrailPrompt>();
  for (const raw of doc.prompts) {
    const entry = assertMapping(raw, "Guardrail prompt");
    assertNoUnknownFields(
      entry,
      ["id", "purpose", "variables", "template"],
      "Guardrail prompt",
    );
    if (typeof entry.id !== "string" || !entry.id) {
      throw new Error("Guardrail prompts need a non-empty string id");
    }
    if (prompts.has(entry.id)) {
      throw new Error(`Duplicate guardrail prompt id: ${entry.id}`);
    }
    if (typeof entry.template !== "string" || !entry.template) {
      throw new Error(`Guardrail prompt ${entry.id} needs a non-empty template`);
    }
    if (entry.purpose !== undefined && typeof entry.purpose !== "string") {
      throw new Error(`Guardrail prompt ${entry.id} purpose must be a string`);
    }
    if (
      !Array.isArray(entry.variables) ||
      entry.variables.some((v) => typeof v !== "string")
    ) {
      throw new Error(`Guardrail prompt ${entry.id} variables must be a string list`);
    }
    const templateVariables = [
      ...entry.template.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g),
    ].map((match) => match[1]);
    for (const name of templateVariables) {
      if (!entry.variables.includes(name)) {
        throw new Error(`Guardrail prompt ${entry.id} uses undeclared variable: ${name}`);
      }
    }
    const prompt: GuardrailPrompt = {
      id: entry.id,
      ...(entry.purpose !== undefined ? { purpose: entry.purpose } : {}),
      variables: entry.variables as string[],
      template: entry.template,
    };
    prompts.set(prompt.id, prompt);
  }

  const policies: CompiledPolicy[] = [];
  const policyIds = new Set<string>();
  for (const raw of doc.policies) {
    const entry = assertMapping(raw, "Guardrail policy");
    assertNoUnknownFields(
      entry,
      ["id", "description", "pattern", "flags", "action"],
      "Guardrail policy",
    );
    if (typeof entry.id !== "string" || !entry.id) {
      throw new Error("Guardrail policies need a non-empty string id");
    }
    if (policyIds.has(entry.id)) {
      throw new Error(`Duplicate guardrail policy id: ${entry.id}`);
    }
    if (typeof entry.pattern !== "string" || !entry.pattern) {
      throw new Error(`Guardrail policy ${entry.id} needs a non-empty pattern`);
    }
    if (entry.action !== "block") {
      throw new Error(`Guardrail policy ${entry.id} action must be "block"`);
    }
    if (entry.flags !== undefined && typeof entry.flags !== "string") {
      throw new Error(`Guardrail policy ${entry.id} flags must be a string`);
    }
    policyIds.add(entry.id);
    try {
      policies.push(
        compilePolicy({
          id: entry.id,
          pattern: entry.pattern,
          flags: entry.flags as string | undefined,
          action: "block",
        }),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Guardrail policy ${entry.id} has an invalid pattern: ${message}`);
    }
  }

  return { prompts, policies };
}

function registry(): ParsedRegistry {
  cachedRegistry ??= parseRegistryDocument(
    loadYaml(readFileSync(registryPath(), "utf8")),
  );
  return cachedRegistry;
}

export function resetGuardrailsForTests(): void {
  cachedRegistry = undefined;
}

export function renderPrompt(
  id: string,
  variables: Record<string, string> = {},
): string {
  const prompt = registry().prompts.get(id);
  if (!prompt) {
    throw new Error(`Unknown guardrail prompt id: ${id}`);
  }
  return prompt.template.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (_match, name: string) => {
      const value = variables[name];
      if (value === undefined) {
        throw new Error(`Guardrail prompt ${id} is missing variable: ${name}`);
      }
      return value;
    },
  );
}

export function fenceUntrusted(payload: string): string {
  return renderPrompt("context.fence", { payload });
}

export function screenUntrusted(payload: string): void {
  for (const policy of registry().policies) {
    if (policy.action === "block" && policy.test(payload)) {
      throw llmError("guardrail_block", `guardrail_block: ${policy.id}`);
    }
  }
}
