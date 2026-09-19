# discovery-lifecycle

Discovery-plane worker that owns **concurso exam lifecycle** after crawl:

- Registration **OPEN** / **CLOSED** (`ExamStatus.open|closed`) synced from pluggable checkers
- Richer `ExamLifecyclePhase` calendar (announced → … → archived)
- Soft-archive then hard-delete of **Discovery** stale artifacts when the exam date has passed

Does **not** touch Study (`quizzeira_study`) or Content (`quizzeira_content`) question banks.

## Domain language

| Term | Meaning (pt-BR) | Storage |
| --- | --- | --- |
| OPEN | Inscrições abertas | `Exam.status = open` ↔ `lifecyclePhase = registration_open` |
| CLOSED | Inscrições encerradas | `Exam.status = closed` ↔ `registration_closed` and later |
| PAST DUE | Prazo encerrado (pós-prova); limpeza Discovery | `lifecyclePhase = past_due` → `archived` |

Display labels (operator logs / docs) live in `src/lifecycle/labels.ts` — machine
enum values stay English; default operator-facing copy is **pt-BR**.

| Phase (enum) | Rótulo pt-BR |
| --- | --- |
| `announced` | Anunciado |
| `registration_open` | Inscrições abertas |
| `registration_closed` | Inscrições encerradas |
| `exam_scheduled` | Prova agendada |
| `exam_done` | Prova realizada |
| `past_due` | Prazo encerrado (pós-prova) |
| `cancelled` | Cancelado |
| `archived` | Arquivado |

## State machine

```
announced → registration_open → registration_closed → exam_scheduled → exam_done
                                                              ↘         ↓
                                                         cancelled → past_due → archived
```

Exemplo (pt-BR): *Anunciado* → *Inscrições abertas* → *Inscrições encerradas* →
*Prova agendada* → *Prova realizada* → *Prazo encerrado* → *Arquivado*.

Transitions are idempotent (same phase = noop). Illegal edges are rejected.

Date-driven rules (pure `deriveNextPhase`):

1. `registrationEnd < now` → `registration_closed` (CLOSED)
2. `examDate < now` → `exam_done` then `past_due`
3. `purgeEligibleAt ≤ now` while `past_due` → soft `archived`

## Purge policy (Discovery only)

| Step | When | Effect |
| --- | --- | --- |
| Soft archive | `examDate + softArchiveGraceDays` (default 30) | `lifecyclePhase=archived`, `archivedAt=now`; stop catalog refresh |
| Hard delete | `archivedAt + hardDeleteGraceDays` (default 90) | Delete Artifact rows + TopicQuery for that exam. MinIO objects are content-addressed and shared: an object is deleted **only** if no artifact of another exam holds the key **and** the artifact was never imported into Content (`published=false`). Imported bytes belong to Content's retention pass (`Document.bytesPurgedAt`). A failed object delete keeps its Artifact row for retry. |
| Tombstone | optional `DISCOVERY_LIFECYCLE_DROP_TOMBSTONE` | Delete Exam row; default **keep** tombstone. Content/Study reference exams by `examSlug` without FK, so dropping it orphans their rows for that slug; refused (409) while artifacts remain. |

Never Study/Content.

## Contract with discovery-api

Worker → `INTERNAL_API_URL` (discovery-api):

| Method | Path | Role |
| --- | --- | --- |
| GET | `/internal/lifecycle/exams?limit=` | Batch of exams to evaluate |
| POST | `/internal/lifecycle/transition` | Apply phase + registration status |
| POST | `/internal/lifecycle/purge` | Hard-delete Discovery artifacts |

Local HTTP (this service):

| Method | Path | Role |
| --- | --- | --- |
| GET | `/health` | Liveness |
| POST | `/internal/tick` | Force one pass |

## Checkers

Pluggable (`src/lifecycle/checkers.ts`):

1. `date_window` — OPEN iff `now ≤ registrationEnd` (and after start if set)
2. `crawler_output` — reuse crawler `status` + `statusSource`

Social-scout (Workstream A) can add a checker that posts registration signals without owning the state machine.

## Schema migration

Discovery Prisma: `20260919200000_exam_lifecycle` adds `ExamLifecyclePhase`, `examDate`, `registrationStart`, `archivedAt`, `purgeEligibleAt`.

```bash
npm run db:migrate:discovery
```

## Run

```bash
# with compose stub (see docker-compose.yml service discovery-lifecycle)
DISCOVERY_LIFECYCLE_ENABLED=true \
INTERNAL_API_URL=http://discovery-api:3010 \
INTERNAL_API_KEY=$INTERNAL_API_KEY_DISCOVERY \
WORKER_INTERVAL_MS=900000 \
npm run dev -w @quizzeira/discovery-lifecycle
```

## Tests

```bash
npm run test -w @quizzeira/discovery-lifecycle
# or
npm run test:discovery
```

## Infra handoff (Workstream C)

See [HANDOFF.md](./HANDOFF.md).
