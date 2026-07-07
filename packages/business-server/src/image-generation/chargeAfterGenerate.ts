import { CreditTransactionsModel } from '@/database/models/creditTransactions';
import { SpendLogsModel } from '@/database/models/spendLogs';
import type { LobeChatDatabase } from '@lobechat/database';

interface AfterChargeParams {
  userId: string;
  workspaceId?: string | null;
  imageNum: number;
  model: string;
  provider: string;
  sessionId?: string;
  durationMs?: number;
}

const CREDITS_PER_IMAGE = 5;

export async function chargeAfterGenerate(
  params: AfterChargeParams,
  db?: LobeChatDatabase,
): Promise<void> {
  if (!db) return;

  const creditsConsumed = CREDITS_PER_IMAGE * params.imageNum;
  const creditModel = new CreditTransactionsModel(db);
  const balance = await creditModel.getUserBalance(params.userId);
  const balanceAfter = balance - creditsConsumed;

  await creditModel.create({
    userId: params.userId,
    workspaceId: params.workspaceId || null,
    type: 'consumption',
    amount: -creditsConsumed,
    balanceAfter,
    source: 'api_call',
    referenceId: params.sessionId || null,
    referenceType: 'session',
    description: `Image generation — ${params.model} × ${params.imageNum}`,
  });

  const spendLogsModel = new SpendLogsModel(db);
  await spendLogsModel.create({
    userId: params.userId,
    workspaceId: params.workspaceId || null,
    sessionId: params.sessionId || null,
    modelId: params.model,
    modelName: params.model,
    providerId: params.provider,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    inputCost: 0,
    outputCost: creditsConsumed * 0.01,
    totalCost: creditsConsumed * 0.01,
    creditsConsumed,
    pricePerCredit: 0.01,
    durationMs: params.durationMs || null,
    status: 'success',
  });
}
