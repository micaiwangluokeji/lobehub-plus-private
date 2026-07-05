import { lambdaClient } from '@/libs/trpc/client';

type WorkspaceMemberClient = typeof lambdaClient.workspaceMember;

class WorkspaceMemberService {
  list(workspaceId: string) {
    return lambdaClient.workspaceMember.list.query({ workspaceId });
  }

  updateRole(input: Parameters<WorkspaceMemberClient['updateRole']['mutate']>[0]) {
    return lambdaClient.workspaceMember.updateRole.mutate(input);
  }

  remove(input: Parameters<WorkspaceMemberClient['remove']['mutate']>[0]) {
    return lambdaClient.workspaceMember.remove.mutate(input);
  }

  invite(input: Parameters<WorkspaceMemberClient['invite']['mutate']>[0]) {
    return lambdaClient.workspaceMember.invite.mutate(input);
  }

  listInvitations(workspaceId: string) {
    return lambdaClient.workspaceMember.listInvitations.query({ workspaceId });
  }

  revokeInvitation(input: Parameters<WorkspaceMemberClient['revokeInvitation']['mutate']>[0]) {
    return lambdaClient.workspaceMember.revokeInvitation.mutate(input);
  }

  getMyMembership(workspaceId: string) {
    return lambdaClient.workspaceMember.getMyMembership.query({ workspaceId });
  }
}

export const workspaceMemberService = new WorkspaceMemberService();
