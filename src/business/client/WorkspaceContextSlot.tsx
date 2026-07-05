import { type PropsWithChildren } from 'react';

import { useWorkspaceUrlSync } from '@/features/Workspace/useWorkspaceUrlSync';

export default function WorkspaceContextSlot({ children }: PropsWithChildren) {
  useWorkspaceUrlSync();
  return children;
}
