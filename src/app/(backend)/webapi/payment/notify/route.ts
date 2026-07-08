import { createDecipheriv, createVerify } from 'crypto';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { serverDB } from '@/database/server';
import { PaymentOrdersModel } from '@/database/models/paymentOrders';
import { CreditTransactionsModel } from '@/database/models/creditTransactions';

// =====================================================================
// WeChat Pay V3 — AES-256-GCM helper
//
// Reference: https://pay.weixin.qq.com/doc/v3/merchant/4012071382
// Cipher layout: ciphertext = [encrypted_payload][16-byte authTag]
// Key: APIv3 密钥 (32 bytes UTF-8)
// =====================================================================
const decryptWechatResource = (params: {
  ciphertext: string;
  associatedData: string;
  nonce: string;
  apiKey: string;
}): Record<string, any> => {
  const { ciphertext, associatedData, nonce, apiKey } = params;
  if (!apiKey) throw new Error('Missing APIv3 key');

  const key = Buffer.from(apiKey, 'utf8');
  if (key.length !== 32) {
    throw new Error(`APIv3 key must be 32 bytes, got ${key.length}`);
  }

  const buf = Buffer.from(ciphertext, 'base64');
  if (buf.length < 16) {
    throw new Error('Ciphertext too short');
  }

  const authTag = buf.subarray(buf.length - 16);
  const data = buf.subarray(0, buf.length - 16);

  const decipher = createDecipheriv('aes-256-gcm', key, nonce, { authTagLength: 16 });
  decipher.setAuthTag(authTag);
  if (associatedData) {
    decipher.setAAD(Buffer.from(associatedData, 'utf8'));
  }
  const plain = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');

  try {
    return JSON.parse(plain);
  } catch {
    throw new Error('Decrypted payload is not valid JSON');
  }
};

// =====================================================================
// WeChat Pay V3 — RSA-SHA256 signature verification
//
// Reference: https://pay.weixin.qq.com/doc/v3/merchant/4012365342
// Sign string: `${timestamp}\n${nonce}\n${body}\n`
// Note: WeChat-Serial is either a platform certificate serial (legacy)
// or "PUB_KEY_ID_xxx" (public key id, newer flow).
// =====================================================================
const verifyWechatSign = (params: {
  timestamp: string;
  nonce: string;
  body: string;
  serial: string;
  signature: string;
  publicKey: string; // PEM-encoded public key
}): boolean => {
  const signStr = `${params.timestamp}\n${params.nonce}\n${params.body}\n`;
  const verify = createVerify('RSA-SHA256');
  verify.update(signStr);
  return verify.verify(params.publicKey, params.signature, 'base64');
};

// =====================================================================
// Alipay — RSA2 signature verification
// =====================================================================
const verifyAlipaySign = (params: {
  params: Record<string, string>;
  publicKey: string; // PEM-encoded Alipay public key
}): boolean => {
  const { params: p, publicKey } = params;
  const sign = p.sign;
  if (!sign) return false;

  const filtered: Record<string, string> = {};
  Object.keys(p)
    .filter((k) => k !== 'sign' && k !== 'sign_type' && p[k])
    .sort()
    .forEach((k) => {
      filtered[k] = p[k];
    });

  const signStr = Object.entries(filtered)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const verify = createVerify('RSA-SHA256');
  verify.update(signStr);
  return verify.verify(publicKey, sign, 'base64');
};

// =====================================================================
// Process a paid order — idempotent; mark as paid and grant credits.
// =====================================================================
const processPaidOrder = async (params: {
  orderId: string;
  transactionId: string;
  paidAt: Date;
  paymentMethod: 'wechat' | 'alipay';
  rawAmount?: number;
}) => {
  const { orderId, transactionId, paidAt, paymentMethod, rawAmount } = params;
  const ordersModel = new PaymentOrdersModel(serverDB);

  const order = await ordersModel.getById(orderId);
  if (!order) {
    return { ok: false, status: 404, message: `Order ${orderId} not found` };
  }

  if (order.status === 'paid') {
    // Idempotent — same transaction id, return success; otherwise reject
    if (order.transactionId === transactionId) {
      return { ok: true, alreadyPaid: true };
    }
    return {
      ok: false,
      status: 409,
      message: `Order ${orderId} already paid with different transaction`,
    };
  }

  if (order.status !== 'pending') {
    return { ok: false, status: 409, message: `Order ${orderId} status is ${order.status}` };
  }

  // Optional amount sanity check (rawAmount is in cents for WeChat, yuan for Alipay out_trade_no? Actually both are cents/yuan consistently — adapt.)
  if (typeof rawAmount === 'number' && rawAmount !== order.amount) {
    console.warn(
      `[PaymentNotify] Amount mismatch for order ${orderId}: callback=${rawAmount}, db=${order.amount}`,
    );
  }

  await ordersModel.markAsPaid(orderId, transactionId, paidAt);

  if (order.credits > 0) {
    const creditModel = new CreditTransactionsModel(serverDB);
    const balance = (await creditModel.getUserBalance(order.userId)) || 0;
    await creditModel.create({
      userId: order.userId,
      type: 'top_up',
      amount: order.credits,
      balanceAfter: balance + order.credits,
      source: 'payment',
      referenceId: orderId,
      referenceType: 'order',
      description: `${paymentMethod === 'wechat' ? 'WeChat Pay' : 'Alipay'} order #${orderId}`,
    });
  }

  return { ok: true };
};

// =====================================================================
// WeChat Pay V3 callback handler
// =====================================================================
const handleWechatCallback = async (req: NextRequest, rawBody: string) => {
  const serial = req.headers.get('wechatpay-serial') || '';
  const signature = req.headers.get('wechatpay-signature') || '';
  const timestamp = req.headers.get('wechatpay-timestamp') || '';
  const nonce = req.headers.get('wechatpay-nonce') || '';

  if (!serial || !signature || !timestamp || !nonce) {
    return NextResponse.json(
      { code: 'FAIL', message: 'Missing WeChat signature headers' },
      { status: 400 },
    );
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ code: 'FAIL', message: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.event_type !== 'TRANSACTION.SUCCESS') {
    // Acknowledge non-payment events so WeChat stops retrying
    return new NextResponse(null, { status: 200 });
  }

  if (!body.resource) {
    return NextResponse.json(
      { code: 'FAIL', message: 'Missing resource in callback' },
      { status: 400 },
    );
  }

  // Load payment config — needed for APIv3 key (decryption) and merchant public key
  const paymentConfig = await serverDB.query.paymentConfigs.findFirst();
  if (!paymentConfig) {
    return NextResponse.json(
      { code: 'FAIL', message: 'Payment config not configured' },
      { status: 500 },
    );
  }
  const wechat = paymentConfig.wechat;
  if (!wechat?.enabled || !wechat.apiKey) {
    return NextResponse.json(
      { code: 'FAIL', message: 'WeChat Pay not enabled or APIv3 key missing' },
      { status: 500 },
    );
  }

  // 1. Verify signature using SDK (auto-fetches and caches platform certificate on first call)
  let signatureValid = false;
  try {
    const { WechatPay } = await import('wechatpay-node-v3');
    const pay = new WechatPay({
      appid: wechat.appId!,
      mchid: wechat.mchId!,
      publicKey: Buffer.from(wechat.apiCert || '', 'utf8'),
      privateKey: Buffer.from(wechat.apiCert || '', 'utf8'),
      key: wechat.apiKey,
    });

    signatureValid = await pay.verifySign({
      timestamp,
      nonce,
      body: rawBody,
      serial,
      signature,
      apiSecret: wechat.apiKey,
    });
  } catch (e) {
    console.error('[WechatNotify] verifySign error:', e);

    // Fallback: use cached platform public key if admin has configured one,
    // or attempt to verify with merchant's own key (which won't work for WeChat,
    // but is a safer fallback than accepting unverified traffic).
    if (wechat.apiCert) {
      try {
        signatureValid = verifyWechatSign({
          timestamp,
          nonce,
          body: rawBody,
          serial,
          signature,
          publicKey: wechat.apiCert,
        });
      } catch {
        signatureValid = false;
      }
    }
  }

  if (!signatureValid) {
    return NextResponse.json({ code: 'FAIL', message: 'Invalid signature' }, { status: 401 });
  }

  // 2. Decrypt resource with AES-256-GCM
  let decrypted: Record<string, any>;
  try {
    decrypted = decryptWechatResource({
      ciphertext: body.resource.ciphertext,
      associatedData: body.resource.associated_data || '',
      nonce: body.resource.nonce,
      apiKey: wechat.apiKey,
    });
  } catch (e) {
    console.error('[WechatNotify] Decrypt error:', e);
    return NextResponse.json({ code: 'FAIL', message: 'Decrypt resource failed' }, { status: 400 });
  }

  // 3. Validate trade state
  if (decrypted.trade_state !== 'SUCCESS') {
    // Acknowledge to stop retries for non-SUCCESS states
    return new NextResponse(null, { status: 200 });
  }

  const outTradeNo = decrypted.out_trade_no;
  const transactionId = decrypted.transaction_id;
  if (!outTradeNo || !transactionId) {
    return NextResponse.json(
      { code: 'FAIL', message: 'Missing out_trade_no or transaction_id' },
      { status: 400 },
    );
  }

  // 4. Mark order as paid (idempotent)
  const result = await processPaidOrder({
    orderId: outTradeNo,
    transactionId,
    paidAt: decrypted.success_time ? new Date(decrypted.success_time) : new Date(),
    paymentMethod: 'wechat',
    rawAmount:
      typeof decrypted.amount?.total === 'number' ? decrypted.amount.total / 100 : undefined,
  });

  if (!result.ok) {
    const status = (result as any).status || 500;
    return NextResponse.json({ code: 'FAIL', message: result.message }, { status });
  }

  // WeChat expects 200 with empty body on success
  return new NextResponse(null, { status: 200 });
};

// =====================================================================
// Alipay callback handler
// =====================================================================
const handleAlipayCallback = async (_req: NextRequest, rawBody: string) => {
  // Alipay POSTs form-encoded data: app_id=xxx&out_trade_no=xxx&sign=xxx
  const parsed: Record<string, string> = {};
  for (const part of rawBody.split('&')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    const k = decodeURIComponent(part.slice(0, eq).replace(/\+/g, ' '));
    const v = decodeURIComponent(part.slice(eq + 1).replace(/\+/g, ' '));
    parsed[k] = v;
  }

  const paymentConfig = await serverDB.query.paymentConfigs.findFirst();
  if (!paymentConfig) {
    return new NextResponse('fail', { status: 500 });
  }
  const alipay = paymentConfig.alipay;
  if (!alipay?.publicKey) {
    return new NextResponse('fail', { status: 500 });
  }

  const valid = verifyAlipaySign({ params: parsed, publicKey: alipay.publicKey });
  if (!valid) {
    return new NextResponse('fail', { status: 400 });
  }

  if (parsed.trade_status !== 'TRADE_SUCCESS' && parsed.trade_status !== 'TRADE_FINISHED') {
    // Alipay expects "success" string for non-SUCCESS to stop retries
    return new NextResponse('success', { status: 200 });
  }

  const outTradeNo = parsed.out_trade_no;
  const transactionId = parsed.trade_no;
  if (!outTradeNo || !transactionId) {
    return new NextResponse('fail', { status: 400 });
  }

  const result = await processPaidOrder({
    orderId: outTradeNo,
    transactionId,
    paidAt: parsed.gmt_payment ? new Date(parsed.gmt_payment) : new Date(),
    paymentMethod: 'alipay',
    rawAmount: parsed.total_amount ? Number(parsed.total_amount) : undefined,
  });

  if (!result.ok) {
    return new NextResponse('fail', { status: (result as any).status || 500 });
  }
  return new NextResponse('success', { status: 200 });
};

// =====================================================================
// Route — dispatch by headers
// =====================================================================
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // WeChat Pay V3 callback detection — must have these headers
  const isWechat =
    !!req.headers.get('wechatpay-serial') &&
    !!req.headers.get('wechatpay-signature') &&
    !!req.headers.get('wechatpay-timestamp') &&
    !!req.headers.get('wechatpay-nonce');

  if (isWechat) {
    try {
      return await handleWechatCallback(req, rawBody);
    } catch (err) {
      console.error('[PaymentNotify] WeChat handler error:', err);
      return NextResponse.json({ code: 'FAIL', message: 'Internal error' }, { status: 500 });
    }
  }

  // Otherwise treat as Alipay (form-encoded) callback
  try {
    return await handleAlipayCallback(req, rawBody);
  } catch (err) {
    console.error('[PaymentNotify] Alipay handler error:', err);
    return new NextResponse('fail', { status: 500 });
  }
}
