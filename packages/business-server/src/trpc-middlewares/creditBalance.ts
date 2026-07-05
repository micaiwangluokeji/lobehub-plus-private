import { TRPCError } from '@trpc/server';

import { trpc } from '@/libs/trpc/lambda/init';
import { CreditTransactionsModel } from '@/database/models/creditTransactions';
import { PaymentPlansModel } from '@/database/models/paymentPlans';
import type { LobeChatDatabase } from '@lobechat/database';

interface CreditCtx {
  serverDB?: LobeChatDatabase;
  userId?: string | null;
  workspaceId?: string | null;
}

/**
 * Estimate credits needed for this request. Called before the AI call.
 * Returns the estimated cost or throws 402 if balance is insufficient.
 */
const MIN_ESTIMATED_COST = 1; // minimum 1 credit to proceed

async function checkBalance(
  ctx: CreditCtx,
): Promise<{ balance: number }> {
  const userId = ctx.userId;
  if (!userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }
  if (!ctx.serverDB) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
  }

  const creditModel = new CreditTransactionsModel(ctx.serverDB);
  const balance = await creditModel.getUserBalance(userId);

  if (balance < MIN_ESTIMATED_COST) {
    throw new TRPCError({
      code: 'PAYMENT_REQUIRED',
      message: 'Insufficient credits. Please top up to continue.',
    });
  }

  return { balance };
}

/**
 * Middleware that checks the user has enough credits to proceed with an AI call.
 * Throws 402 PAYMENT_REQUIRED if balance < 1.
 *
 * Combine with `withRbacPermission` to protect AI-invoke routes.
 */
export const creditBalanceCheck = trpc.middleware(async (opts) => {
  await checkBalance(opts.ctx as CreditCtx);
  return opts.next();
});

/**
 * Consume credits after a successful AI call. Call this from the after-hook
 * (not middleware — it's a plain function).
 */
export async function consumeCredits(params: {
  db: LobeChatDatabase;
  userId: string;
  workspaceId?: string | null;
  tokens: { promptTokens: number; completionTokens: number };
  modelId: string;
  modelName: string;
  providerId: string;
  sessionId?: string;
  durationMs?: number;
}): Promise<{
  creditsConsumed: number;
  cost: number;
  balanceAfter: number;
}> {
  const { db, userId, workspaceId, tokens, modelId, modelName, providerId, sessionId, durationMs } =
    params;

  const plansModel = new PaymentPlansModel(db);
  const creditModel = new CreditTransactionsModel(db);
  const config = await plansModel.getCreditConfig();

  const pricePerCredit = config?.pricePerCredit || 0.01;
  const cost = calculateCost(tokens.promptTokens, tokens.completionTokens);
  const creditsConsumed = Math.max(1, Math.ceil(cost / pricePerCredit));

  const currentBalance = await creditModel.getUserBalance(userId);
  const balanceAfter = currentBalance - creditsConsumed;

  // Write consumption transaction
  await creditModel.create({
    userId,
    workspaceId: workspaceId || null,
    type: 'consumption',
    amount: -creditsConsumed,
    balanceAfter,
    source: 'api_call',
    referenceId: sessionId || null,
    referenceType: 'session',
    description: `${modelName} — ${tokens.promptTokens} prompt + ${tokens.completionTokens} completion tokens`,
  });

  // Write spend log
  const { SpendLogsModel } = await import('@/database/models/spendLogs');
  const spendLogsModel = new SpendLogsModel(db);
  await spendLogsModel.create({
    userId,
    workspaceId: workspaceId || null,
    sessionId: sessionId || null,
    modelId,
    modelName,
    providerId,
    promptTokens: tokens.promptTokens,
    completionTokens: tokens.completionTokens,
    totalTokens: tokens.promptTokens + tokens.completionTokens,
    inputCost: estimateInputCost(tokens.promptTokens),
    outputCost: estimateOutputCost(tokens.completionTokens),
    totalCost: cost,
    creditsConsumed,
    pricePerCredit,
    durationMs: durationMs || null,
    status: 'success',
  });

  return { creditsConsumed, cost, balanceAfter };
}

// ── Pricing helpers ──────────────────────────────────

function calculateCost(promptTokens: number, completionTokens: number): number {
  // Default pricing: GPT-level rates in CNY per token
  const inputPricePerToken = 0.00001;  // ~¥0.01/1K tokens
  const outputPricePerToken = 0.00003; // ~¥0.03/1K tokens
  return promptTokens * inputPricePerToken + completionTokens * outputPricePerToken;
}

function estimateInputCost(tokens: number): number {
  return tokens * 0.00001;
}

function estimateOutputCost(tokens: number): number {
  return tokens * 0.00003;
}
