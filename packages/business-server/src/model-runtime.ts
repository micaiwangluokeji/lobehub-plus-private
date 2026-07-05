import type { ModelRuntimeHooks } from '@lobechat/model-runtime';

/**
 * Business model-runtime hooks.
 *
 * Credit balance checking is handled at the tRPC middleware level
 * (creditBalanceCheck middleware) — this function returns hooks for
 * post-invoke actions like spend logging.
 *
 * For full credit consumption + spend_log integration, wire the
 * `consumeCredits` function from `trpc-middlewares/creditBalance.ts`
 * into the after-invoke hook once the DB context is accessible here.
 */
export function getBusinessModelRuntimeHooks(
  _userId: string,
  _provider: string,
  _workspaceId?: string,
): ModelRuntimeHooks | undefined {
  // Return hooks object for future integration.
  // Credit gate → tRPC middleware; Spend log → after-invoke (pending DB access).
  return {
    afterInvoke: async (_params) => {
      // TODO: Integrate consumeCredits(db, userId, tokens, model...) once DB
      // context is passed through to model-runtime hooks.
    },
  };
}
