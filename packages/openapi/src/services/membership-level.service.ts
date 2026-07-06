import { asc, count, eq } from 'drizzle-orm';

import { membershipLevels } from '@/database/schemas/membershipLevels';
import type { LobeChatDatabase } from '@/database/type';

import type {
  CreateMembershipLevelRequest,
  MembershipLevelItem,
  MembershipLevelListRequest,
  MembershipLevelListResponse,
  UpdateMembershipLevelRequest,
} from '../types/membership-level.type';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Membership level service — admin-level CRUD over membership_levels table.
 * Does not extend BaseService (no per-user scoping).
 */
export class MembershipLevelService {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  async list(request: MembershipLevelListRequest): Promise<MembershipLevelListResponse> {
    const page = request.page ?? DEFAULT_PAGE;
    const pageSize = request.pageSize ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(membershipLevels)
        .orderBy(asc(membershipLevels.sort))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(membershipLevels),
    ]);

    return {
      data,
      page,
      pageSize,
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  async getById(id: string): Promise<MembershipLevelItem | null> {
    const [row] = await this.db
      .select()
      .from(membershipLevels)
      .where(eq(membershipLevels.id, id))
      .limit(1);
    return row || null;
  }

  async create(data: CreateMembershipLevelRequest): Promise<MembershipLevelItem> {
    const [row] = await this.db
      .insert(membershipLevels)
      .values({
        color: data.color ?? null,
        enabled: data.enabled ?? true,
        features: data.features ?? [],
        icon: data.icon ?? null,
        level: data.level ?? 0,
        minRechargeTotal: data.minRechargeTotal ?? 0,
        monthlyCreditsBonus: data.monthlyCreditsBonus ?? 0,
        name: data.name,
        slug: data.slug,
        sort: data.sort ?? 0,
        storageBonusMB: data.storageBonusMB ?? 0,
      })
      .returning();
    return row;
  }

  async update(id: string, data: UpdateMembershipLevelRequest): Promise<MembershipLevelItem> {
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };

    if (data.color !== undefined) updateFields.color = data.color;
    if (data.enabled !== undefined) updateFields.enabled = data.enabled;
    if (data.features !== undefined) updateFields.features = data.features;
    if (data.icon !== undefined) updateFields.icon = data.icon;
    if (data.level !== undefined) updateFields.level = data.level;
    if (data.minRechargeTotal !== undefined) updateFields.minRechargeTotal = data.minRechargeTotal;
    if (data.monthlyCreditsBonus !== undefined)
      updateFields.monthlyCreditsBonus = data.monthlyCreditsBonus;
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.slug !== undefined) updateFields.slug = data.slug;
    if (data.sort !== undefined) updateFields.sort = data.sort;
    if (data.storageBonusMB !== undefined) updateFields.storageBonusMB = data.storageBonusMB;

    const [row] = await this.db
      .update(membershipLevels)
      .set(updateFields)
      .where(eq(membershipLevels.id, id))
      .returning();
    return row;
  }

  async delete(id: string): Promise<{ id: string }> {
    await this.db.delete(membershipLevels).where(eq(membershipLevels.id, id));
    return { id };
  }
}
