import { lambdaClient } from '@/libs/trpc/client';

export interface OfficialGroupItem {
  groupId: string;
  avatar: string | null;
  backgroundColor: string | null;
  description: string | null;
  title: string | null;
  updatedAt: Date | null;
  viewCount: number;
  memberCount: number;
}

export interface OfficialGroupListResult {
  items: OfficialGroupItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface InstallOfficialGroupResult {
  alreadyInstalled: boolean;
  groupId: string | undefined;
}

export interface PendingReviewGroupItem {
  groupId: string;
  title: string | null;
  description: string | null;
  avatar: string | null;
  backgroundColor: string | null;
  submittedAt: Date | null;
  submitterId: string | null;
  submitterUsername: string | null;
  submitterFullName: string | null;
  submitterAvatar: string | null;
}

export interface PendingReviewGroupListResult {
  items: PendingReviewGroupItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

class OfficialGroupService {
  getOfficialGroups = async (params?: {
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<OfficialGroupListResult> => {
    return lambdaClient.group.getOfficialGroups.query(params);
  };

  getOfficialGroup = async (groupId: string) => {
    return lambdaClient.group.getOfficialGroup.query({ groupId });
  };

  installOfficialGroup = async (groupId: string): Promise<InstallOfficialGroupResult> => {
    return lambdaClient.group.installOfficialGroup.mutate({ groupId });
  };

  publishAsOfficialGroup = async (groupId: string) => {
    return lambdaClient.group.publishAsOfficialGroup.mutate({ groupId });
  };

  unpublishOfficialGroup = async (groupId: string) => {
    return lambdaClient.group.unpublishOfficialGroup.mutate({ groupId });
  };

  isOfficialGroup = async (groupId: string): Promise<boolean> => {
    const result = await lambdaClient.group.isOfficialGroup.query({ groupId });
    return result.isOfficial;
  };

  /**
   * Submit a group for review. VIP users (`group:publish:owner`) cannot
   * publish directly — this routes through `publishAsOfficialGroup`, which
   * branches on the caller's role: admins publish to `'official'` directly,
   * VIPs are queued as `'pending_review'` for a super_admin to approve.
   */
  submitForReview = async (groupId: string) => {
    return lambdaClient.group.publishAsOfficialGroup.mutate({ groupId });
  };

  /** Approve a pending-review group (super_admin only). */
  approveReview = async (groupId: string) => {
    return lambdaClient.group.approveGroupReview.mutate({ groupId });
  };

  /** Reject a pending-review group (super_admin only). */
  rejectReview = async (groupId: string) => {
    return lambdaClient.group.rejectGroupReview.mutate({ groupId });
  };

  /** Paginated list of groups awaiting review (super_admin only). */
  getPendingReviews = async (params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PendingReviewGroupListResult> => {
    return lambdaClient.group.getPendingGroupReviews.query(params);
  };

  /** Whether a group is currently awaiting review. */
  isPendingReview = async (groupId: string): Promise<boolean> => {
    const result = await lambdaClient.group.isGroupPendingReview.query({ groupId });
    return result.isPendingReview;
  };
}

export const officialGroupService = new OfficialGroupService();
