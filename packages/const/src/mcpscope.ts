import type { IconType } from '@icons-pack/react-simple-icons';
import {
  SiAlibaba,
  SiBaidu,
  SiDingtalk,
  SiGithub,
  SiMicroblog,
  SiZhihu,
} from '@icons-pack/react-simple-icons';

export interface McpscopeAppType {
  appSlug: string;
  author: string;
  authorUrl?: string;
  description: string;
  icon: string | IconType;
  identifier: string;
  label: string;
  readme: string;
  category: 'enterprise' | 'social' | 'storage' | 'search' | 'other';
  envVars?: string[];
  mcpUrl?: string;
}

export const MCOPSCOPE_APP_TYPES: McpscopeAppType[] = [
  {
    appSlug: 'FEISHU',
    author: 'ModelScope',
    authorUrl: 'https://modelscope.cn',
    description: '飞书是字节跳动旗下的企业协作平台',
    icon: 'https://hub-apac-1.lobeobjects.space/assets/logos/feishu.svg',
    identifier: 'feishu',
    label: '飞书',
    readme: '集成飞书，通过自然语言发送消息、管理用户、操作文档和日程安排，提升团队协作效率。',
    category: 'enterprise',
    envVars: ['FEISHU_APP_ID', 'FEISHU_APP_SECRET'],
  },
  {
    appSlug: 'DINGTALK',
    author: 'ModelScope',
    authorUrl: 'https://modelscope.cn',
    description: '钉钉是阿里巴巴旗下的企业协作平台',
    icon: SiDingtalk,
    identifier: 'dingtalk',
    label: '钉钉',
    readme: '集成钉钉，通过自然语言发送消息、管理审批流程、安排日程，提升企业办公效率。',
    category: 'enterprise',
    envVars: ['DINGTALK_APP_KEY', 'DINGTALK_APP_SECRET'],
  },
  {
    appSlug: 'WECHATWORK',
    author: 'ModelScope',
    authorUrl: 'https://modelscope.cn',
    description: '企业微信是腾讯旗下的企业通讯与办公工具',
    icon: 'https://hub-apac-1.lobeobjects.space/assets/logos/wechatwork.svg',
    identifier: 'wechatwork',
    label: '企业微信',
    readme: '集成企业微信，通过自然语言发送消息、管理客户联系、操作通讯录和审批流程。',
    category: 'enterprise',
    envVars: ['WECHATWORK_CORP_ID', 'WECHATWORK_APP_SECRET'],
  },
  {
    appSlug: 'WECHAT_OFFICIAL',
    author: 'ModelScope',
    authorUrl: 'https://modelscope.cn',
    description: '微信公众号是腾讯提供的公众平台服务',
    icon: 'https://hub-apac-1.lobeobjects.space/assets/logos/wechat.svg',
    identifier: 'wechat-official',
    label: '微信公众号',
    readme: '集成微信公众号，通过自然语言发送图文消息、管理粉丝、操作菜单和素材库。',
    category: 'social',
    envVars: ['WECHAT_APP_ID', 'WECHAT_APP_SECRET'],
  },
  {
    appSlug: 'XIAOHONGSHU',
    author: 'ModelScope',
    authorUrl: 'https://modelscope.cn',
    description: '小红书是年轻人的生活方式平台',
    icon: 'https://hub-apac-1.lobeobjects.space/assets/logos/xiaohongshu.svg',
    identifier: 'xiaohongshu',
    label: '小红书',
    readme: '集成小红书，通过自然语言发布笔记、搜索内容、管理评论和互动，助力内容创作。',
    category: 'social',
    envVars: ['XIAOHONGSHU_COOKIES'],
  },
  {
    appSlug: 'ALIPAY',
    author: 'ModelScope',
    authorUrl: 'https://modelscope.cn',
    description: '支付宝是阿里巴巴旗下的第三方支付平台',
    icon: SiAlibaba,
    identifier: 'alipay',
    label: '支付宝',
    readme: '集成支付宝，通过自然语言查询账单、转账、管理订单，实现便捷的支付管理。',
    category: 'other',
    envVars: ['ALIPAY_APP_ID', 'ALIPAY_PRIVATE_KEY'],
  },
  {
    appSlug: 'ALICLOUD_DISK',
    author: 'ModelScope',
    authorUrl: 'https://modelscope.cn',
    description: '阿里云盘是阿里巴巴旗下的云存储服务',
    icon: 'https://hub-apac-1.lobeobjects.space/assets/logos/alicloud.svg',
    identifier: 'alicloud-disk',
    label: '阿里云盘',
    readme: '集成阿里云盘，通过自然语言上传下载文件、管理文件夹、分享内容，实现云端文件管理。',
    category: 'storage',
    envVars: ['ALICLOUD_DISK_TOKEN'],
  },
  {
    appSlug: 'BAIDU_SEARCH',
    author: 'ModelScope',
    authorUrl: 'https://modelscope.cn',
    description: '百度搜索是全球最大的中文搜索引擎',
    icon: SiBaidu,
    identifier: 'baidu-search',
    label: '百度搜索',
    readme: '集成百度搜索，通过自然语言进行网页搜索、新闻搜索、知识查询，获取丰富的信息资源。',
    category: 'search',
    envVars: ['BAIDU_API_KEY', 'BAIDU_SECRET_KEY'],
  },
  {
    appSlug: 'WEIBO',
    author: 'ModelScope',
    authorUrl: 'https://modelscope.cn',
    description: '微博是中国领先的社交媒体平台',
    icon: SiMicroblog,
    identifier: 'weibo',
    label: '微博',
    readme: '集成微博，通过自然语言发布微博、管理评论、查询热点、互动粉丝，提升社交影响力。',
    category: 'social',
    envVars: ['WEIBO_APP_KEY', 'WEIBO_APP_SECRET'],
  },
  {
    appSlug: 'ZHIHU',
    author: 'ModelScope',
    authorUrl: 'https://modelscope.cn',
    description: '知乎是中国领先的问答社区',
    icon: SiZhihu,
    identifier: 'zhihu',
    label: '知乎',
    readme: '集成知乎，通过自然语言提问、回答问题、发布文章、管理专栏，分享知识和见解。',
    category: 'social',
    envVars: ['ZHIHU_COOKIES'],
  },
  {
    appSlug: 'MINIMAX',
    author: 'ModelScope',
    authorUrl: 'https://modelscope.cn',
    description: 'MiniMax 是一家专注于AI技术的创新公司',
    icon: SiGithub,
    identifier: 'minimax',
    label: 'MiniMax',
    readme: '集成 MiniMax AI 模型，通过自然语言调用强大的 AI 能力，实现多模态对话和创作。',
    category: 'other',
    envVars: ['MINIMAX_API_KEY'],
  },
];

export const MCOPSCOPE_CATEGORIES = {
  enterprise: { label: '企业协作', identifier: 'enterprise' },
  social: { label: '社交平台', identifier: 'social' },
  storage: { label: '云存储', identifier: 'storage' },
  search: { label: '搜索工具', identifier: 'search' },
  other: { label: '其他', identifier: 'other' },
};

export const getMcpscopeAppByIdentifier = (identifier: string) =>
  MCOPSCOPE_APP_TYPES.find((s) => s.identifier === identifier);
