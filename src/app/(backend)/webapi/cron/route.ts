import { NextResponse } from 'next/server';

import { serverDB } from '@/database/server';
import { SubscriptionsModel } from '@/database/models/subscriptions';
import { PaymentOrdersModel } from '@/database/models/paymentOrders';

/**
 * Cron endpoint for scheduled tasks:
 * - Expire unpaid orders (every 60s)
 * - Downgrade expired subscriptions (daily)
 *
 * Protected by CRON_SECRET header.
 */
export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];

  // 1. Expire unpaid orders
  try {
    const ordersModel = new PaymentOrdersModel(serverDB);
    const now = new Date();
    const expired = await serverDB
      .update({ status: 'expired' } as any)
      .from('payment_orders')
      .where('status = \'pending\' AND expired_at < NOW()')
      .execute();
    results.push(`Expired ${(expired as any)?.rowCount ?? 0} orders`);
  } catch (e) {
    results.push(`Order expiry error: ${e}`);
  }

  // 2. Downgrade expired subscriptions (daily)
  try {
    const subsModel = new SubscriptionsModel(serverDB);
    const expiring = await subsModel.getExpiringSubscriptions(1); // next 1 day
    for (const sub of expiring) {
      await serverDB
        .update({ status: 'expired' } as any)
        .from('subscriptions')
        .where('id = $1')
        .execute([sub.id]);
    }
    results.push(`Expired ${expiring.length} subscriptions`);
  } catch (e) {
    results.push(`Subscription expiry error: ${e}`);
  }

  return NextResponse.json({ results, timestamp: new Date().toISOString() });
}
