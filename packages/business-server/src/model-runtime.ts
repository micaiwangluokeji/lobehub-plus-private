import type { ModelRuntimeHooks } from '@lobechat/model-runtime';

/**
 * Business model-runtime hooks.
 *
 * Credit balance checking is handled at the tRPC middleware level
 * (creditBalanceCheck middleware). This function returns undefined
 * for now — once the model-runtime package exposes DB context to
 * hooks, wire `consumeCredits` from `trpc-middlewares/creditBalance.ts`
 * into the after-invoke hook for full spend logging.
 */
export function getBusinessModelRuntimeHooks(
  _userId: string,
  _provider: string,
  _workspaceId?: string,
): ModelRuntimeHooks | undefined {
  return undefined;
}
