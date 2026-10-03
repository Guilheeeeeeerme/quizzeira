import { circuitHealth, type CircuitState } from "./circuit";
import { configuredProviderNames, hasLlmProvider } from "./llm";
import { checkJevReadiness, jevConfigured, type JevReadiness } from "./jev";

export interface ProviderCircuitStatus {
  provider: string;
  state: CircuitState;
  available: boolean;
}

export interface ProviderReadiness {
  ready: boolean;
  hasProvider: boolean;
  providers: ProviderCircuitStatus[];
  reason?: "no_configured_provider" | "all_providers_circuit_open" | "jev_key_missing";
  /** JEV staged-authority readiness (audit plan §6/§8). */
  jev: JevReadiness;
}

/**
 * Readiness for provider-dependent workers (§9): unhealthy when no generation
 * provider is configured, when its circuit is open, or when a JEV task mode
 * is `shadow`/`active` without a JEV key (audit plan §6 — never a silent no-op).
 */
export async function checkProviderReadiness(): Promise<ProviderReadiness> {
  const jev = checkJevReadiness();
  if (!hasLlmProvider()) {
    return { ready: false, hasProvider: false, providers: [], reason: "no_configured_provider", jev };
  }
  const names = [...configuredProviderNames(), ...(jevConfigured() ? ["jev"] : [])];
  const providers = await Promise.all(
    names.map(async (provider) => {
      const health = await circuitHealth(provider);
      return { provider, state: health.state, available: health.state !== "open" };
    }),
  );
  const generationUp = providers.some((p) => p.provider !== "jev" && p.available);
  if (!jev.ok) {
    // A mode that needs a key it does not have is a config failure, loud at startup.
    return { ready: false, hasProvider: true, providers, reason: "jev_key_missing", jev };
  }
  return {
    ready: generationUp,
    hasProvider: true,
    providers,
    reason: generationUp ? undefined : "all_providers_circuit_open",
    jev,
  };
}
