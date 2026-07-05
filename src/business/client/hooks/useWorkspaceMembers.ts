import { useFetchWorkspaceMembers } from './useFetchWorkspaceMembers';

export interface WorkspaceMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: Date;
  email?: string | null;
  fullName?: string | null;
  avatar?: string | null;
}

export const useWorkspaceMembers = (): WorkspaceMember[] => {
  const { data } = useFetchWorkspaceMembers();
  return data as WorkspaceMember[];
};
