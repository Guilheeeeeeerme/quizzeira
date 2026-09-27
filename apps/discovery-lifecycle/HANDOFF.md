# Handoff — discovery-lifecycle

## Workstream A (social scout)

- Do **not** invent a parallel OPEN/CLOSED store. Emit registration signals into Discovery (`Exam.status` / dates) or call lifecycle transition via discovery-api.
- Prefer feeding `registrationStart` / `registrationEnd` / `examDate` parsed from official pages; lifecycle derives CLOSED and past-due.
- Optional: add a `RegistrationChecker` that consumes scout evidence; keep state machine ownership here.

## Workstream C (infra)

App-local Compose stub exists in quizzeira `docker-compose.yml` (`discovery-lifecycle`). Production needs:

| Item | Notes |
| --- | --- |
| GHCR image | `quizzeira/discovery-lifecycle` Dockerfile (prod, not `.dev`) under infra `containers/` or app Dockerfile |
| Deploy isolation | Own service in quizzeira Compose on VPS; do not rebuild crawler/api when shipping lifecycle-only |
| Env | `INTERNAL_API_URL` → discovery-api; `INTERNAL_API_KEY` = discovery scoped key; `DISCOVERY_LIFECYCLE_*` grace days; keep `DISCOVERY_LIFECYCLE_DRY_RUN=true` until operators confirm calendar-year GC logs look right |
| Migrate | `db:migrate:discovery` before first prod start (Exam lifecycle columns) |
| Ports | Dev HTTP `:3012` health/tick; no public ingress required |
| Secrets | No new secrets beyond existing discovery internal key |
| Observability | Log lines `lifecycle transition` / `hard_delete`; wire Loki labels `service=discovery-lifecycle` |

Do **not** point this worker at Headroom (no LLM). Do **not** grant Study/Content DB URLs.
