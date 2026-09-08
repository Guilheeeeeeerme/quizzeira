import type {
  GeneratedQuestionInput,
  LocaleCode,
  QuestionBankDepositRequest,
} from "@quizzeira/shared";
import { redis } from "../lib/redis";
import { screenGeneratedQuestions } from "../lib/screen-model";
import { upsertBankQuestions } from "./question-bank.store";

const PENDING_LIST = "qa:bank:proposals";
const PENDING_TTL_SEC = 60 * 60 * 24 * 14;

export interface BankDepositProposal {
  id: string;
  proposedAt: string;
  deposit: QuestionBankDepositRequest;
}

function proposalKey(id: string): string {
  return `qa:bank:proposal:${id}`;
}

/** Stage LLM bank deposits for admin HITL (seed writes stay live). */
export async function proposeBankDeposit(
  deposit: QuestionBankDepositRequest,
): Promise<BankDepositProposal> {
  if (!deposit.questions?.length) {
    throw Object.assign(new Error("questions required"), { statusCode: 400 });
  }
  screenGeneratedQuestions(deposit.questions);
  const id = crypto.randomUUID();
  const proposal: BankDepositProposal = {
    id,
    proposedAt: new Date().toISOString(),
    deposit,
  };
  const pipeline = redis.pipeline();
  pipeline.set(proposalKey(id), JSON.stringify(proposal), "EX", PENDING_TTL_SEC);
  pipeline.lpush(PENDING_LIST, id);
  pipeline.ltrim(PENDING_LIST, 0, 199);
  await pipeline.exec();
  return proposal;
}

export async function listBankDepositProposals(): Promise<BankDepositProposal[]> {
  const ids = await redis.lrange(PENDING_LIST, 0, 99);
  const out: BankDepositProposal[] = [];
  for (const id of ids) {
    const raw = await redis.get(proposalKey(id));
    if (raw) out.push(JSON.parse(raw) as BankDepositProposal);
  }
  return out;
}

export async function approveBankDepositProposal(
  id: string,
): Promise<{ id: string; upserted: number }> {
  const raw = await redis.get(proposalKey(id));
  if (!raw) {
    throw Object.assign(new Error("No pending bank deposit proposal"), { statusCode: 404 });
  }
  const proposal = JSON.parse(raw) as BankDepositProposal;
  screenGeneratedQuestions(proposal.deposit.questions);
  const result = await upsertBankQuestions(proposal.deposit);
  await redis.del(proposalKey(id));
  await redis.lrem(PENDING_LIST, 0, id);
  return { id, upserted: result.upserted };
}

export async function rejectBankDepositProposal(id: string): Promise<{ ok: true }> {
  await redis.del(proposalKey(id));
  await redis.lrem(PENDING_LIST, 0, id);
  return { ok: true };
}

export type { GeneratedQuestionInput, LocaleCode };
