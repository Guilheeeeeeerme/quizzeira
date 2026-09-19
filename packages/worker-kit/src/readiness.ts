import { circuitHealth, type CircuitState } from "./circuit";
import { configuredProviderNames, hasLlmProvider } from "./llm";

export interface ProviderCircuitStatus {
  provider: string;
  state: CircuitState;
  available: boolean;
}

export interface ProviderReadiness {
  ready: boolean;
  hasProvider: boolean;
  providers: ProviderCircuitStatus[];
  reason?: "no_configured_provider" | "all_providers_circuit_open";
}

/**
 * Readiness for provider-dependent workers (§9): unhealthy when no provider
 * is configured, or when every configured provider's circuit is open. A
 * single open provider among several does not fail readiness — that's what
 * the circuit's own failover already covers.
 */
export async function checkProviderReadiness(): Promise<ProviderReadiness> {
  if (!hasLlmProvider()) {
    return { ready: false, hasProvider: false, providers: [], reason: "no_configured_provider" };
  }
  const names = configuredProviderNames();
  const providers = await Promise.all(
    names.map(async (provider) => {
      const health = await circuitHealth(provider);
      return { provider, state: health.state, available: health.state !== "open" };
    }),
  );
  const ready = providers.some((p) => p.available);
  return {
    ready,
    hasProvider: true,
    providers,
    reason: ready ? undefined : "all_providers_circuit_open",
  };
}
