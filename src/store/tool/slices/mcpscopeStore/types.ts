export enum McpscopeServerStatus {
  ACTIVE = 'active',
  ERROR = 'error',
  DISCONNECTED = 'disconnected',
}

export interface McpscopeTool {
  description?: string;
  inputSchema: {
    properties?: Record<string, any>;
    required?: string[];
    type: string;
  };
  name: string;
}

export interface McpscopeServer {
  appSlug: string;
  createdAt: number;
  errorMessage?: string;
  icon?: string;
  identifier: string;
  label: string;
  mcpUrl?: string;
  status: McpscopeServerStatus;
  tools?: McpscopeTool[];
}

export interface CreateMcpscopeServerParams {
  appSlug: string;
  identifier: string;
  label: string;
  mcpUrl: string;
  envVars?: Record<string, string>;
}

export interface CallMcpscopeToolParams {
  identifier: string;
  toolArgs?: Record<string, unknown>;
  toolSlug: string;
}

export interface CallMcpscopeToolResult {
  data?: any;
  error?: string;
  success: boolean;
}
