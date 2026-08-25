import { PrismaClient, QuestionType } from "@prisma/client";

const prisma = new PrismaClient();

const LEVELS = [
  { slug: "beginner", label: "Beginner", sortOrder: 1 },
  { slug: "novice", label: "Novice", sortOrder: 2 },
  { slug: "intermediate", label: "Intermediate", sortOrder: 3 },
  { slug: "advanced", label: "Advanced", sortOrder: 4 },
  { slug: "pro", label: "Pro", sortOrder: 5 },
] as const;

type McqSeed = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type OpenSeed = {
  prompt: string;
  referenceAnswer: string;
};

const MCQ_BY_LEVEL: Record<string, McqSeed[]> = {
  beginner: [
    {
      prompt: "What is the primary purpose of a system prompt in an LLM application?",
      options: [
        "To store user passwords securely",
        "To define the assistant's behavior and constraints",
        "To compress model weights for faster inference",
        "To replace the need for a database",
      ],
      correctIndex: 1,
      explanation: "System prompts set role, tone, and rules for the model.",
    },
    {
      prompt: "Which component typically orchestrates tool calls in an AI agent?",
      options: ["The agent loop / orchestrator", "The CSS stylesheet", "The DNS resolver", "The GPU driver"],
      correctIndex: 0,
      explanation: "An agent loop decides when to call tools and processes results.",
    },
    {
      prompt: "What does RAG stand for in AI development?",
      options: [
        "Random Access Generation",
        "Retrieval-Augmented Generation",
        "Recursive Agent Graph",
        "Runtime API Gateway",
      ],
      correctIndex: 1,
      explanation: "RAG retrieves relevant documents then generates answers grounded in them.",
    },
    {
      prompt: "Why use structured output (e.g. JSON schema) from an LLM?",
      options: [
        "To increase token cost only",
        "To make downstream code reliably parse responses",
        "To disable tool calling",
        "To bypass rate limits",
      ],
      correctIndex: 1,
      explanation: "Structured output enables deterministic parsing in application code.",
    },
    {
      prompt: "What is a common first step when building a workflow automation with AI?",
      options: [
        "Deploy directly to production without tests",
        "Define triggers, inputs, and expected outputs",
        "Remove all logging",
        "Hard-code every user message",
      ],
      correctIndex: 1,
      explanation: "Clear I/O contracts make automations testable and maintainable.",
    },
    {
      prompt: "Which metric best measures factual accuracy of a Q&A bot on a fixed dataset?",
      options: ["VRAM usage", "Evaluation accuracy / F1 on labeled Q&A pairs", "CSS bundle size", "Ping latency"],
      correctIndex: 1,
      explanation: "Labeled eval sets measure correctness against known answers.",
    },
    {
      prompt: "What role do 'tools' play for an LLM agent?",
      options: [
        "They let the model take actions beyond text generation",
        "They replace the LLM entirely",
        "They only change UI colors",
        "They encrypt the model weights",
      ],
      correctIndex: 0,
      explanation: "Tools extend agents with APIs, search, code execution, etc.",
    },
    {
      prompt: "Why keep human-readable logs in agent workflows?",
      options: [
        "To debug decision paths and tool failures",
        "To slow down the system intentionally",
        "To expose API keys in plain text",
        "To avoid writing tests",
      ],
      correctIndex: 0,
      explanation: "Observability is critical for debugging non-deterministic agent behavior.",
    },
  ],
  novice: [
    {
      prompt: "What is 'few-shot prompting'?",
      options: [
        "Providing example input-output pairs in the prompt",
        "Training a new model from scratch",
        "Deleting context between turns",
        "Using only one token per request",
      ],
      correctIndex: 0,
      explanation: "Examples in the prompt guide the model without fine-tuning.",
    },
    {
      prompt: "When should you add a retrieval step before generation?",
      options: [
        "When answers must use private or frequently updated knowledge",
        "When you want to disable the LLM",
        "Only when GPU memory is unlimited",
        "Never for factual tasks",
      ],
      correctIndex: 0,
      explanation: "RAG helps when static model knowledge is insufficient or stale.",
    },
    {
      prompt: "What is an agent 'memory' in many frameworks?",
      options: [
        "Persistent storage of conversation or facts across sessions",
        "The model's training dataset",
        "A browser cookie for styling",
        "The GPU cache only",
      ],
      correctIndex: 0,
      explanation: "Memory lets agents retain context beyond a single request window.",
    },
    {
      prompt: "Why validate tool arguments before execution?",
      options: [
        "To prevent invalid or unsafe API calls",
        "To increase hallucinations",
        "To skip error handling",
        "To remove type safety",
      ],
      correctIndex: 0,
      explanation: "Schema validation catches malformed tool calls early.",
    },
    {
      prompt: "What is chain-of-thought prompting used for?",
      options: [
        "Encouraging step-by-step reasoning for complex tasks",
        "Chaining multiple databases without indexes",
        "Eliminating the need for evals",
        "Bypassing authentication",
      ],
      correctIndex: 0,
      explanation: "CoT can improve performance on multi-step reasoning tasks.",
    },
    {
      prompt: "In workflow automation, what is an idempotent step?",
      options: [
        "Safe to retry without duplicate side effects",
        "Always fails on second run",
        "Requires manual GPU tuning",
        "Cannot be logged",
      ],
      correctIndex: 0,
      explanation: "Idempotency is essential for reliable retries in automations.",
    },
    {
      prompt: "Which practice reduces prompt injection risk?",
      options: [
        "Separating instructions from untrusted user content",
        "Embedding secrets in system prompts",
        "Disabling all input validation",
        "Trusting tool outputs blindly",
      ],
      correctIndex: 0,
      explanation: "Clear trust boundaries limit injection surface area.",
    },
    {
      prompt: "What does 'temperature' control in LLM sampling?",
      options: ["Randomness of token selection", "Database connection pool size", "Redis TTL", "HTTP port"],
      correctIndex: 0,
      explanation: "Higher temperature increases response diversity.",
    },
  ],
  intermediate: [
    {
      prompt: "What is ReAct in agent design?",
      options: [
        "Reasoning and Acting in interleaved steps",
        "A React.js UI library for LLMs",
        "A MySQL replication mode",
        "A Redis clustering algorithm",
      ],
      correctIndex: 0,
      explanation: "ReAct alternates thought, action (tool), and observation loops.",
    },
    {
      prompt: "Why use embedding models in RAG pipelines?",
      options: [
        "To represent text for semantic similarity search",
        "To replace JWT authentication",
        "To compile TypeScript",
        "To manage Docker volumes",
      ],
      correctIndex: 0,
      explanation: "Embeddings enable vector search over document chunks.",
    },
    {
      prompt: "What is a common pattern for long-running agent tasks?",
      options: [
        "Job queue with checkpointed state",
        "Single synchronous HTTP request with no timeout",
        "Disable all retries",
        "Store state only in browser localStorage",
      ],
      correctIndex: 0,
      explanation: "Queues and checkpoints handle tasks exceeding request timeouts.",
    },
    {
      prompt: "How do eval harnesses help AI products?",
      options: [
        "Regression-test quality as prompts or models change",
        "Eliminate the need for monitoring",
        "Guarantee zero cost",
        "Remove human review forever",
      ],
      correctIndex: 0,
      explanation: "Evals catch quality regressions before release.",
    },
    {
      prompt: "What is tool result truncation often used for?",
      options: [
        "Fitting large tool outputs into context limits",
        "Increasing token usage without reason",
        "Disabling agent memory",
        "Removing authentication",
      ],
      correctIndex: 0,
      explanation: "Summarization or truncation keeps context within model limits.",
    },
    {
      prompt: "In multi-agent systems, what does a 'supervisor' agent typically do?",
      options: [
        "Route subtasks to specialized worker agents",
        "Render CSS for the frontend",
        "Manage MySQL replication",
        "Replace all eval datasets",
      ],
      correctIndex: 0,
      explanation: "Supervisors coordinate delegation and aggregate results.",
    },
    {
      prompt: "Why version prompts in production systems?",
      options: [
        "Track changes and roll back quality regressions",
        "Prevent all A/B testing",
        "Hide logs from operators",
        "Disable structured output",
      ],
      correctIndex: 0,
      explanation: "Prompt versioning supports reproducibility and rollback.",
    },
    {
      prompt: "What is hallucination in LLM outputs?",
      options: [
        "Confident but incorrect or unsupported statements",
        "A GPU overheating event",
        "A valid database migration",
        "A type of Redis lock",
      ],
      correctIndex: 0,
      explanation: "Hallucinations are fabricated or ungrounded claims.",
    },
  ],
  advanced: [
    {
      prompt: "What is the purpose of a critic/reflection step in agent loops?",
      options: [
        "Evaluate draft outputs and refine before final answer",
        "Disable tool calling permanently",
        "Remove all logging",
        "Skip safety filters",
      ],
      correctIndex: 0,
      explanation: "Reflection loops improve answer quality on complex tasks.",
    },
    {
      prompt: "Why shard vector indexes in large RAG systems?",
      options: [
        "Scale search horizontally across corpora",
        "Reduce embedding dimension to zero",
        "Eliminate need for chunking",
        "Disable semantic search",
      ],
      correctIndex: 0,
      explanation: "Sharding supports billion-scale vector corpora.",
    },
    {
      prompt: "What does 'grounding' mean in AI responses?",
      options: [
        "Tying claims to retrieved or verified sources",
        "Running models without GPUs",
        "Using only random tokens",
        "Removing all citations",
      ],
      correctIndex: 0,
      explanation: "Grounding reduces unsupported factual claims.",
    },
    {
      prompt: "When is fine-tuning preferred over prompting alone?",
      options: [
        "When behavior must be consistently specialized at scale",
        "When you have no labeled or example data ever",
        "When you want zero maintenance",
        "When you never deploy updates",
      ],
      correctIndex: 0,
      explanation: "Fine-tuning helps entrenched domain style or format needs.",
    },
    {
      prompt: "What is observability for LLM apps?",
      options: [
        "Traces, logs, and metrics across prompts, tools, and latency",
        "Only measuring page load CSS",
        "Disabling error reports",
        "Hiding token usage",
      ],
      correctIndex: 0,
      explanation: "LLM observability spans chains, tools, cost, and quality.",
    },
    {
      prompt: "How can parallel tool calls improve agent latency?",
      options: [
        "Independent tools run concurrently instead of sequentially",
        "They always increase serial wait time",
        "They disable caching",
        "They remove authentication",
      ],
      correctIndex: 0,
      explanation: "Parallelism helps when tools have no ordering dependency.",
    },
    {
      prompt: "What is a guardrail in production AI systems?",
      options: [
        "Policy checks on inputs/outputs before users see results",
        "A CSS framework",
        "A MySQL index type",
        "A Docker network driver",
      ],
      correctIndex: 0,
      explanation: "Guardrails enforce safety, PII, and policy constraints.",
    },
    {
      prompt: "Why use deterministic eval splits?",
      options: [
        "Compare model/prompt changes on the same test cases",
        "Randomize production user data",
        "Avoid all metrics",
        "Skip regression detection",
      ],
      correctIndex: 0,
      explanation: "Fixed splits make before/after comparisons meaningful.",
    },
  ],
  pro: [
    {
      prompt: "What tradeoff does speculative decoding address?",
      options: [
        "Inference latency vs. acceptance rate of draft tokens",
        "Database normalization vs. denormalization",
        "CSS grid vs. flexbox",
        "JWT vs. session cookies only",
      ],
      correctIndex: 0,
      explanation: "Draft models propose tokens verified by the target model.",
    },
    {
      prompt: "In enterprise agent platforms, why use policy engines?",
      options: [
        "Centralize authorization for tools and data access",
        "Remove audit trails",
        "Disable all encryption",
        "Hard-code secrets in prompts",
      ],
      correctIndex: 0,
      explanation: "Policy engines enforce who/what agents can access.",
    },
    {
      prompt: "What is context distillation in advanced LLM pipelines?",
      options: [
        "Compressing long contexts into smaller retained representations",
        "Deleting all chat history always",
        "Running without embeddings",
        "Disabling retrieval entirely",
      ],
      correctIndex: 0,
      explanation: "Distillation preserves salient information within token budgets.",
    },
    {
      prompt: "Why deploy canary releases for prompt changes?",
      options: [
        "Limit blast radius while measuring quality metrics",
        "Ship breaking changes to all users at once",
        "Avoid all monitoring",
        "Remove rollback options",
      ],
      correctIndex: 0,
      explanation: "Canaries compare quality and error rates on a subset of traffic.",
    },
    {
      prompt: "What is tool routing in multi-tool agents?",
      options: [
        "Selecting the best tool given intent and constraints",
        "Random tool selection every step",
        "Disabling schemas",
        "Removing observability",
      ],
      correctIndex: 0,
      explanation: "Routing reduces wrong-tool errors and cost.",
    },
    {
      prompt: "How do human-in-the-loop workflows improve high-stakes AI tasks?",
      options: [
        "Experts approve or correct before finalization",
        "They eliminate all latency requirements",
        "They remove accountability",
        "They disable logging",
      ],
      correctIndex: 0,
      explanation: "HITL adds oversight for compliance and quality.",
    },
    {
      prompt: "Why track cost per successful task in agent evals?",
      options: [
        "Optimize quality per dollar spent",
        "Maximize token usage intentionally",
        "Hide spend from finance",
        "Disable caching always",
      ],
      correctIndex: 0,
      explanation: "Unit economics matter for production agent systems.",
    },
    {
      prompt: "What is a failure mode of unconstrained agent autonomy?",
      options: [
        "Runaway tool loops or unbounded spend",
        "Guaranteed perfect accuracy",
        "Zero latency",
        "Automatic compliance",
      ],
      correctIndex: 0,
      explanation: "Budgets, step limits, and guardrails prevent runaway behavior.",
    },
  ],
};

const OPEN_BY_LEVEL: Record<string, OpenSeed[]> = {
  beginner: [
    {
      prompt: "In one or two sentences, explain what an AI agent is.",
      referenceAnswer:
        "An AI agent is a system that uses an LLM to perceive goals, plan steps, and take actions (often via tools) to accomplish tasks autonomously or semi-autonomously.",
    },
    {
      prompt: "Give one example of prompt engineering improving a chatbot response.",
      referenceAnswer:
        "Adding clear instructions and an example format helps the model stay on-topic and return structured answers users can parse.",
    },
    {
      prompt: "Why is it useful to store conversation history server-side?",
      referenceAnswer:
        "Server-side storage enables progress tracking, auditability, and consistent experience across devices and sessions.",
    },
  ],
  novice: [
    {
      prompt: "Describe when you would choose RAG over fine-tuning.",
      referenceAnswer:
        "Choose RAG when knowledge changes frequently or is proprietary, and you need grounded answers without retraining the model.",
    },
    {
      prompt: "What is one benefit of defining JSON schema for LLM outputs?",
      referenceAnswer:
        "It makes downstream integration reliable because applications can validate and parse responses programmatically.",
    },
    {
      prompt: "Explain what a workflow trigger is in automation.",
      referenceAnswer:
        "A trigger is the event that starts a workflow, such as a webhook, schedule, or user action.",
    },
  ],
  intermediate: [
    {
      prompt: "How would you design logging for a multi-step agent?",
      referenceAnswer:
        "Log each step with correlation IDs, tool name, inputs/outputs (redacted), latency, and errors to reconstruct the decision path.",
    },
    {
      prompt: "What metrics would you track for a RAG Q&A service?",
      referenceAnswer:
        "Track retrieval recall, answer accuracy, latency, token cost, abstention rate, and user feedback on helpfulness.",
    },
    {
      prompt: "Explain prompt injection in plain language.",
      referenceAnswer:
        "Prompt injection is when untrusted user content manipulates the model to ignore instructions or perform unintended actions.",
    },
  ],
  advanced: [
    {
      prompt: "Outline a strategy to reduce hallucinations in a customer support bot.",
      referenceAnswer:
        "Use RAG with citations, confidence thresholds, guardrails, eval suites, and escalation to humans for low-confidence cases.",
    },
    {
      prompt: "When would you split a monolithic agent into specialized sub-agents?",
      referenceAnswer:
        "When domains differ significantly, tools are distinct, or parallel specialization improves quality and maintainability.",
    },
    {
      prompt: "Describe how you'd run A/B tests on prompts safely.",
      referenceAnswer:
        "Randomize cohorts, monitor quality and safety metrics, cap exposure, and roll back on regression with versioned prompts.",
    },
  ],
  pro: [
    {
      prompt: "Design principles for SSO-ready micro-frontends in an AI product.",
      referenceAnswer:
        "Central auth issuer, shared cookie domain, shell app for layout/auth, federated remotes, and API contracts owned by backend services.",
    },
    {
      prompt: "How do you balance agent autonomy with operational safety?",
      referenceAnswer:
        "Set step/time/cost budgets, require approvals for sensitive tools, enforce policies, and maintain full observability.",
    },
    {
      prompt: "Explain how async human correction fits an educational quiz platform.",
      referenceAnswer:
        "Submit queues attempts as pending; reviewers or workers grade open responses later; users receive scores and feedback when status is corrected.",
    },
  ],
};

async function main() {
  for (const level of LEVELS) {
    const dbLevel = await prisma.difficultyLevel.upsert({
      where: { slug: level.slug },
      update: { label: level.label, sortOrder: level.sortOrder },
      create: level,
    });

    for (const mcq of MCQ_BY_LEVEL[level.slug]) {
      const existing = await prisma.question.findFirst({
        where: { levelId: dbLevel.id, prompt: mcq.prompt },
      });
      if (!existing) {
        await prisma.question.create({
          data: {
            levelId: dbLevel.id,
            type: QuestionType.MULTIPLE_CHOICE,
            prompt: mcq.prompt,
            options: mcq.options,
            correctIndex: mcq.correctIndex,
            explanation: mcq.explanation,
          },
        });
      }
    }

    for (const open of OPEN_BY_LEVEL[level.slug]) {
      const existing = await prisma.question.findFirst({
        where: { levelId: dbLevel.id, prompt: open.prompt },
      });
      if (!existing) {
        await prisma.question.create({
          data: {
            levelId: dbLevel.id,
            type: QuestionType.OPEN,
            prompt: open.prompt,
            referenceAnswer: open.referenceAnswer,
          },
        });
      }
    }
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
