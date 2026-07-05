import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { serverDB } from '@/database/server/db';
import { PaymentOrdersModel } from '@/database/models/paymentOrders';
import { CreditTransactionsModel } from '@/database/models/creditTransactions';

/**
 * WeChat Pay V3 notification callback handler.
 *
 * Note: This is a skeleton — actual WeChat SDK signature verification
 * requires `wechatpay-node-v3` SDK to be installed and configured.
 *
 * Production checklist:
 * 1. Install `wechatpay-node-v3` SDK
 * 2. Load merchant certificate/private key from payment_configs
 * 3. Verify WeChat signature with `wechatpay.certificates.verifySign()`
 * 4. Decrypt resource with `wechatpay.decryptResource()`
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // TODO: Verify WeChat signature using wechatpay SDK
    // const wechatpay = new Wechatpay({ mchId, privateKey, certs, secretKey });
    // const verified = wechatpay.certificates.verifySign(rawBody, headers);

    const body = JSON.parse(rawBody);
    const { resource } = body;

    if (!resource) {
      return NextResponse.json({ code: 'FAIL', message: 'Missing resource' }, { status: 400 });
    }

    // TODO: Decrypt resource
    // const decrypted = wechatpay.decryptResource(resource);
    const decrypted = resource.ciphertext ? JSON.parse(resource.ciphertext) : body;

    const { out_trade_no, transaction_id } = decrypted;

    if (!out_trade_no || !transaction_id) {
      return NextResponse.json({ code: 'FAIL', message: 'Missing order info' }, { status: 400 });
    }

    const paymentOrdersModel = new PaymentOrdersModel(serverDB);
    const order = await paymentOrdersModel.getById(out_trade_no);

    if (!order) {
      return NextResponse.json({ code: 'FAIL', message: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'paid') {
      // Already paid — acknowledge to avoid repeated notification
      return NextResponse.json({ code: 'SUCCESS' });
    }

    // Mark order as paid
    await paymentOrdersModel.markAsPaid(order.id, transaction_id, new Date());

    // Grant credits to user
    if (order.credits > 0) {
      const creditTransactionsModel = new CreditTransactionsModel(serverDB);
      await creditTransactionsModel.create({
        userId: order.userId,
        type: 'top_up',
        amount: order.credits,
        balanceAfter: order.credits,
        source: 'payment',
        referenceId: order.id,
        referenceType: 'order',
        description: `WeChat Pay order #${order.id}`,
      });
    }

    // TODO: Check membership level upgrade after recharge

    return NextResponse.json({ code: 'SUCCESS' });
  } catch (error) {
    console.error('[WxPayNotify] Error:', error);
    return NextResponse.json({ code: 'FAIL', message: 'Internal error' }, { status: 500 });
  }
}
