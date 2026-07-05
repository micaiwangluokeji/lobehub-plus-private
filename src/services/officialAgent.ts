import { lambdaClient } from '@/libs/trpc/client';

export interface OfficialAgentItem {
  agentId: string;
  avatar: string | null;
  backgroundColor: string | null;
  description: string | null;
  slug: string | null;
  title: string | null;
  updatedAt: Date | null;
  viewCount: number;
}

export interface OfficialAgentListResult {
  items: OfficialAgentItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface InstallOfficialAgentResult {
  agentId: string;
  alreadyInstalled: boolean;
}

export interface PendingReviewAgentItem {
  agentId: string;
  title: string | null;
  description: string | null;
  avatar: string | null;
  backgroundColor: string | null;
  slug: string | null;
  submittedAt: Date | null;
  submitterId: string | null;
  submitterUsername: string | null;
  submitterFullName: string | null;
  submitterAvatar: string | null;
}

export interface PendingReviewAgentListResult {
  items: PendingReviewAgentItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

class OfficialAgentService {
  getOfficialAgents = async (params?: {
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<OfficialAgentListResult> => {
    return lambdaClient.agent.getOfficialAgents.query(params);
  };

  getOfficialAgent = async (agentId: string) => {
    return lambdaClient.agent.getOfficialAgent.query({ agentId });
  };

  installOfficialAgent = async (agentId: string): Promise<InstallOfficialAgentResult> => {
    return lambdaClient.agent.installOfficialAgent.mutate({ agentId });
  };

  publishAsOfficialAgent = async (agentId: string) => {
    return lambdaClient.agent.publishAsOfficialAgent.mutate({ agentId });
  };

  unpublishOfficialAgent = async (agentId: string) => {
    return lambdaClient.agent.unpublishOfficialAgent.mutate({ agentId });
  };

  isOfficialAgent = async (agentId: string): Promise<boolean> => {
    const result = await lambdaClient.agent.isOfficialAgent.query({ agentId });
    return result.isOfficial;
  };

  /**
   * Submit an agent for review. VIP users (`agent:publish:owner`) cannot
   * publish directly — this routes through `publishAsOfficialAgent`, which
   * branches on the caller's role: admins publish to `'official'` directly,
   * VIPs are queued as `'pending_review'` for a super_admin to approve.
   */
  submitForReview = async (agentId: string) => {
    return lambdaClient.agent.publishAsOfficialAgent.mutate({ agentId });
  };

  /** Approve a pending-review agent (super_admin only). */
  approveReview = async (agentId: string) => {
    return lambdaClient.agent.approveAgentReview.mutate({ agentId });
  };

  /** Reject a pending-review agent (super_admin only). */
  rejectReview = async (agentId: string) => {
    return lambdaClient.agent.rejectAgentReview.mutate({ agentId });
  };

  /** Paginated list of agents awaiting review (super_admin only). */
  getPendingReviews = async (params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PendingReviewAgentListResult> => {
    return lambdaClient.agent.getPendingAgentReviews.query(params);
  };

  /** Whether an agent is currently awaiting review. */
  isPendingReview = async (agentId: string): Promise<boolean> => {
    const result = await lambdaClient.agent.isAgentPendingReview.query({ agentId });
    return result.isPendingReview;
  };
}

export const officialAgentService = new OfficialAgentService();
