import { lambdaClient } from '@/libs/trpc/client';

type WorkspaceClient = typeof lambdaClient.workspace;

class WorkspaceService {
  list() {
    return lambdaClient.workspace.list.query();
  }

  create(input: Parameters<WorkspaceClient['create']['mutate']>[0]) {
    return lambdaClient.workspace.create.mutate(input);
  }

  getById(id: string) {
    return lambdaClient.workspace.getById.query({ id });
  }

  getBySlug(slug: string) {
    return lambdaClient.workspace.getBySlug.query({ slug });
  }

  update(input: Parameters<WorkspaceClient['update']['mutate']>[0]) {
    return lambdaClient.workspace.update.mutate(input);
  }

  delete(id: string) {
    return lambdaClient.workspace.delete.mutate({ id });
  }

  countUserWorkspaces() {
    return lambdaClient.workspace.countUserWorkspaces.query();
  }
}

export const workspaceService = new WorkspaceService();
