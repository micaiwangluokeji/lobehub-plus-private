export enum RecommendedSkillType {
  Builtin = 'builtin',
  Lobehub = 'lobehub',
  Mcpscope = 'mcpscope',
}

export interface RecommendedSkillItem {
  id: string;
  type: RecommendedSkillType;
}

export const RECOMMENDED_SKILLS: RecommendedSkillItem[] = [
  // Builtin skills
  { id: 'lobe-artifacts', type: RecommendedSkillType.Builtin },
  { id: 'lobe-user-memory', type: RecommendedSkillType.Builtin },
  { id: 'lobe-cloud-sandbox', type: RecommendedSkillType.Builtin },
  { id: 'lobe-task', type: RecommendedSkillType.Builtin },
  { id: 'lobe-agent-documents', type: RecommendedSkillType.Builtin },
  { id: 'lobe-message', type: RecommendedSkillType.Builtin },
  // LobeHub skills
  { id: 'notion', type: RecommendedSkillType.Lobehub },
  { id: 'posthog', type: RecommendedSkillType.Lobehub },
  { id: 'twitter', type: RecommendedSkillType.Lobehub },
  // Mcpscope skills (China native services)
  { id: 'feishu', type: RecommendedSkillType.Mcpscope },
  { id: 'dingtalk', type: RecommendedSkillType.Mcpscope },
  { id: 'wechatwork', type: RecommendedSkillType.Mcpscope },
  { id: 'wechat-official', type: RecommendedSkillType.Mcpscope },
  { id: 'xiaohongshu', type: RecommendedSkillType.Mcpscope },
  { id: 'alipay', type: RecommendedSkillType.Mcpscope },
  { id: 'baidu-search', type: RecommendedSkillType.Mcpscope },
];
