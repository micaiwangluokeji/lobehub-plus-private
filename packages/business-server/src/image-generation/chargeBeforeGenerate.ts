import { TRPCError } from '@trpc/server';

import { CreditTransactionsModel } from '@/database/models/creditTransactions';
import type { LobeChatDatabase } from '@lobechat/database';

interface ChargeParams {
  clientIp?: string | null;
  configForDatabase: any;
  generationParams: any;
  imageNum: number;
  model: string;
  provider: string;
  userId: string;
  workspaceId?: string;
}

type ChargeResult =
  | undefined
  | {
      data?: any;
      success: true;
    };

const CREDITS_PER_IMAGE = 5; // 5 credits per image generation

export async function chargeBeforeGenerate(
  params: ChargeParams,
  db?: LobeChatDatabase,
): Promise<ChargeResult> {
  if (!db) return undefined;

  const creditModel = new CreditTransactionsModel(db);
  const balance = await creditModel.getUserBalance(params.userId);
  const required = CREDITS_PER_IMAGE * params.imageNum;

  if (balance < required) {
    throw new TRPCError({
      code: 'PAYMENT_REQUIRED',
      message: `Insufficient credits. Need ${required}, have ${balance}. Please top up.`,
    });
  }

  return { success: true };
}
