/**
 * Calculate credits consumed based on token usage.
 *
 * Default pricing (CNY):
 * - Input:  ¥0.01 / 1K tokens
 * - Output: ¥0.03 / 1K tokens
 * - 1 credit = pricePerCredit (default ¥0.01 → 100 credits = ¥1)
 */
export function calculateCreditsByTokens(
  promptTokens: number,
  completionTokens: number,
  pricePerCredit: number = 0.01,
): number {
  const inputCost = (promptTokens / 1000) * 0.01;
  const outputCost = (completionTokens / 1000) * 0.03;
  const totalCost = inputCost + outputCost;
  return Math.max(1, Math.ceil(totalCost / pricePerCredit));
}
