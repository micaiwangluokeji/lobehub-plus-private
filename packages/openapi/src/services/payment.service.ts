import { and, count, desc, eq } from 'drizzle-orm';

import { PaymentOrdersModel } from '@/database/models/paymentOrders';
import { paymentConfigs, paymentOrders } from '@/database/schemas';
import { refundRequests, type RefundRequestItem } from '@/database/schemas/refundRequests';
import type { LobeChatDatabase } from '@/database/type';
import type { PaymentOrderItem } from '@/database/schemas';

import type {
  CreateRefundRequest,
  PaymentConfigResponse,
  PaymentOrderListRequest,
  PaymentOrderListResponse,
  UpdatePaymentConfigRequest,
} from '../types/payment.type';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const createNotFoundError = (message: string): Error => {
  const error = new Error(message);
  error.name = 'NotFoundError';
  return error;
};

const createBusinessError = (message: string): Error => {
  const error = new Error(message);
  error.name = 'BusinessError';
  return error;
};

/**
 * Payment service — admin cross-user perspective.
 * Does not extend BaseService (no per-user scoping).
 */
export class PaymentService {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  async listConfigs(): Promise<PaymentConfigResponse[]> {
    const rows = await this.db.select().from(paymentConfigs);
    return rows;
  }

  async updateConfig(
    id: string,
    data: UpdatePaymentConfigRequest,
  ): Promise<PaymentConfigResponse> {
    const [existing] = await this.db
      .select()
      .from(paymentConfigs)
      .where(eq(paymentConfigs.id, id))
      .limit(1);

    if (!existing) {
      throw createNotFoundError('支付配置不存在');
    }

    const [updated] = await this.db
      .update(paymentConfigs)
      .set({
        alipay: data.alipay ?? existing.alipay,
        currency: data.currency ?? existing.currency,
        notifyUrl: data.notifyUrl ?? existing.notifyUrl,
        paymentTimeout: data.paymentTimeout ?? existing.paymentTimeout,
        updatedAt: new Date(),
        wechat: data.wechat ?? existing.wechat,
      })
      .where(eq(paymentConfigs.id, id))
      .returning();

    return updated;
  }

  async listOrders(request: PaymentOrderListRequest): Promise<PaymentOrderListResponse> {
    const conditions = [];

    if (request.userId) conditions.push(eq(paymentOrders.userId, request.userId));
    if (request.status) conditions.push(eq(paymentOrders.status, request.status));

    const where = and(...conditions);
    const page = request.page ?? DEFAULT_PAGE;
    const pageSize = request.pageSize ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(paymentOrders)
        .where(where)
        .orderBy(desc(paymentOrders.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(paymentOrders).where(where),
    ]);

    return {
      data,
      page,
      pageSize,
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  async getOrderById(id: string): Promise<PaymentOrderItem | null> {
    const model = new PaymentOrdersModel(this.db);
    return model.getById(id);
  }

  async createRefund(
    request: CreateRefundRequest,
    reviewerId: string,
  ): Promise<{ order: PaymentOrderItem; refundRequest: RefundRequestItem }> {
    const model = new PaymentOrdersModel(this.db);
    const order = await model.getById(request.orderId);

    if (!order) {
      throw createNotFoundError('订单不存在');
    }

    if (order.status !== 'paid') {
      throw createBusinessError('仅已支付的订单可发起退款');
    }

    const orderAmount = Number(order.amount);
    const existingRefundAmount = Number(order.refundAmount || 0);
    const newCumulativeRefund = existingRefundAmount + request.amount;

    if (newCumulativeRefund > orderAmount) {
      throw createBusinessError('退款总额不能超过订单金额');
    }

    const refundStatus = newCumulativeRefund >= orderAmount ? 'full' : 'partial';

    const [updatedOrder] = await this.db
      .update(paymentOrders)
      .set({
        refundAmount: newCumulativeRefund,
        refundStatus,
        updatedAt: new Date(),
      })
      .where(eq(paymentOrders.id, request.orderId))
      .returning();

    const [refundRequest] = await this.db
      .insert(refundRequests)
      .values({
        amount: request.amount,
        orderId: request.orderId,
        reason: request.reason,
        reviewerId,
        status: 'pending',
        userId: order.userId,
      })
      .returning();

    return { order: updatedOrder, refundRequest };
  }
}
