import { asc, count, desc } from 'drizzle-orm';

import { PaymentPlansModel } from '@/database/models/paymentPlans';
import { plans, type PlanItem, type UpdatePlanItem } from '@/database/schemas';
import type { LobeChatDatabase } from '@/database/type';

import type {
  CreatePlanRequest,
  PlanListRequest,
  PlanListResponse,
  UpdatePlanRequest,
} from '../types/plan.type';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Plan service — admin cross-user perspective.
 * Does not extend BaseService (no per-user scoping).
 */
export class PlanService {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  async list(request: PlanListRequest): Promise<PlanListResponse> {
    const page = request.page ?? DEFAULT_PAGE;
    const pageSize = request.pageSize ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(plans)
        .orderBy(asc(plans.sort), desc(plans.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(plans),
    ]);

    return {
      data,
      page,
      pageSize,
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  async getById(id: string): Promise<PlanItem | null> {
    const model = new PaymentPlansModel(this.db);
    return model.getPlanById(id);
  }

  async create(data: CreatePlanRequest): Promise<PlanItem | undefined> {
    const model = new PaymentPlansModel(this.db);
    return model.createPlan({
      billingCycle: data.billingCycle ?? 'monthly',
      enabled: data.enabled ?? true,
      features: data.features ?? [],
      monthlyCredits: data.monthlyCredits ?? 0,
      name: data.name,
      personalBudget: data.personalBudget ?? 0,
      price: data.price,
      sort: data.sort ?? 0,
      workspaceBudget: data.workspaceBudget ?? 0,
    });
  }

  async update(id: string, data: UpdatePlanRequest): Promise<PlanItem | undefined> {
    const model = new PaymentPlansModel(this.db);
    const updateData: UpdatePlanItem = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.monthlyCredits !== undefined) updateData.monthlyCredits = data.monthlyCredits;
    if (data.personalBudget !== undefined) updateData.personalBudget = data.personalBudget;
    if (data.workspaceBudget !== undefined) updateData.workspaceBudget = data.workspaceBudget;
    if (data.billingCycle !== undefined) updateData.billingCycle = data.billingCycle;
    if (data.features !== undefined) updateData.features = data.features;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    if (data.sort !== undefined) updateData.sort = data.sort;

    return model.updatePlan(id, updateData);
  }

  async delete(id: string): Promise<{ id: string }> {
    const model = new PaymentPlansModel(this.db);
    await model.deletePlan(id);
    return { id };
  }
}
