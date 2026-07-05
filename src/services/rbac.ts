import { lambdaClient } from '@/libs/trpc/client';

class RbacService {
  getUserPermissions = () => {
    return lambdaClient.user.getUserPermissions.query();
  };

  getUserRoles = () => {
    return lambdaClient.user.getUserRoles.query();
  };
}

export const rbacService = new RbacService();
