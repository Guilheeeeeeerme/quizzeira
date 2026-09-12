# Quizzeira Crawler Redesign - Ralph Constitution

## Goal

Implement the complete crawler redesign described in:

docs/crawler-redesign-spec.md

That document is the canonical source of truth.

## Autonomous execution

This is an unattended Ralph execution environment.

DO NOT ask the user questions.
DO NOT wait for confirmation.
DO NOT stop because an operation needs approval.

Make the best technically sound decision using the specification,
repository context, tests, documentation, and available tools.

You are explicitly authorized to:

- inspect the complete repository
- create, modify, move and delete project files
- install project dependencies
- use npm, pnpm, yarn, bun, pip, uv or other package managers when appropriate
- use Python instead of JavaScript/TypeScript when technically superior
- execute tests
- execute linters
- execute builds
- execute development servers
- execute Docker / Docker Compose
- inspect git history
- create commits
- access the internet and documentation
- download public dependencies
- perform migrations needed by this implementation
- refactor existing implementation substantially
- replace the existing crawler architecture when justified by the spec

Do not modify unrelated external projects.

## Crawler requirement

The crawler exists to generate educational material that prepares
users for the actual subject matter tested by exams.

Questions about metadata such as:

- number of vacancies
- application dates
- examination board trivia
- responsible government agency
- edital metadata

are NOT useful learning questions unless explicitly required as exam content.

Prefer actual study content extracted from:

- apostilas
- textbooks
- ebooks
- previous exams
- official educational material
- subject-specific PDFs/documents/pages

Use deterministic code for extraction, parsing, normalization,
deduplication, classification and sanitization whenever possible.

Use LLMs only where semantic reasoning is actually required.

## Isolation

This worker runs concurrently with other implementations.

Never modify another Ralph worktree.

Use the port assigned by the environment.

Respect:

RALPH_PORT_BASE
PORT
COMPOSE_PROJECT_NAME

If additional network services are required, allocate ports relative
to RALPH_PORT_BASE instead of using project defaults.

Do not kill processes belonging to another worktree.

## Verification

Before considering the implementation complete:

- run the relevant unit tests
- run integration tests
- run lint/typecheck
- build the project
- exercise the crawler against representative real-world sources
- verify generated questions are educational-content-oriented
- inspect representative generated output
- fix failures instead of documenting them away

Only output:

<promise>DONE</promise>

when the complete specification is implemented and verified.