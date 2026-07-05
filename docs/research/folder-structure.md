# LobeHub 目录结构详解

## 总览

LobeHub 采用 Monorepo 架构，使用 pnpm workspace 管理多个包。项目分为三大核心区域：

```
lobehub/
├── apps/              # 独立应用（桌面端、CLI、服务端）
├── packages/          # 共享包（可独立发布的 npm 包）
└── src/               # 主应用源码（Next.js + SPA）
```

---

## 一、apps/ - 独立应用

| 目录 | 说明 | 技术栈 |
|------|------|--------|
| `apps/desktop/` | Electron 桌面端应用 | Electron + Next.js |
| `apps/cli/` | LobeHub 命令行工具 | Node.js + TypeScript |
| `apps/server/` | 独立服务端应用 | Node.js + Hono |

---

## 二、packages/ - 共享包

### 核心运行时

| 包名 | 路径 | 说明 |
|------|------|------|
| `@lobechat/agent-runtime` | `packages/agent-runtime/` | Agent 编排引擎，管理多步骤 Agent 生命周期 |
| `@lobechat/model-runtime` | `packages/model-runtime/` | LLM API 适配层，统一 30+ AI 提供商 |
| `@lobechat/tool-runtime` | `packages/tool-runtime/` | 工具调用运行时 |
| `@lobechat/editor-runtime` | `packages/editor-runtime/` | 富文本编辑器运行时 |

### 数据层

| 包名 | 路径 | 说明 |
|------|------|------|
| `@lobechat/database` | `packages/database/` | 数据库层（Drizzle ORM + PostgreSQL） |
| `@lobechat/types` | `packages/types/` | 全局 TypeScript 类型定义 |
| `@lobechat/const` | `packages/const/` | 常量定义（RBAC、设置、主题等） |

### 业务包

| 包名 | 路径 | 说明 |
|------|------|------|
| `@lobechat/business-config` | `packages/business/config/` | 商业版配置 |
| `@lobechat/business-const` | `packages/business/const/` | 商业版常量（品牌、URL 等） |
| `@lobechat/business-server` | `packages/business-server/` | 商业版服务端逻辑（订阅、计费、积分等） |

### 通信层

| 包名 | 路径 | 说明 |
|------|------|------|
| `@lobechat/trpc` | `packages/trpc/` | tRPC 客户端/服务端封装 |
| `@lobechat/fetch-sse` | `packages/fetch-sse/` | SSE 流式请求封装 |

### Agent 相关

| 包名 | 路径 | 说明 |
|------|------|------|
| `@lobechat/agent-signal` | `packages/agent-signal/` | Agent 信号流水线 |
| `@lobechat/agent-templates` | `packages/agent-templates/` | Agent 模板 |
| `@lobechat/agent-mock` | `packages/agent-mock/` | Agent 测试模拟工具 |
| `@lobechat/agent-tracing` | `packages/agent-tracing/` | Agent 追踪 CLI |
| `@lobechat/builtin-agents` | `packages/builtin-agents/` | 内置 Agent |
| `@lobechat/builtin-skills` | `packages/builtin-skills/` | 内置 Skills |
| `@lobechat/builtin-tools` | `packages/builtin-tools/` | 内置工具 |

### 功能包

| 包名 | 路径 | 说明 |
|------|------|------|
| `@lobechat/model-bank` | `packages/model-bank/` | 模型元数据库（40+ 提供商） |
| `@lobechat/prompts` | `packages/prompts/` | 提示词模板库 |
| `@lobechat/context-engine` | `packages/context-engine/` | 上下文引擎 |
| `@lobechat/locales` | `packages/locales/` | 国际化资源包 |
| `@lobechat/config` | `packages/config/` | 配置管理 |
| `@lobechat/env` | `packages/env/` | 环境变量管理 |
| `@lobechat/file-loaders` | `packages/file-loaders/` | 文件加载器（多种格式） |
| `@lobechat/openapi` | `packages/openapi/` | OpenAPI 兼容层 |

### 聊天适配器

| 包名 | 路径 | 说明 |
|------|------|------|
| `@lobechat/chat-adapter-wechat` | `packages/chat-adapter-wechat/` | 微信适配器 |
| `@lobechat/chat-adapter-feishu` | `packages/chat-adapter-feishu/` | 飞书适配器 |
| `@lobechat/chat-adapter-qq` | `packages/chat-adapter-qq/` | QQ 适配器 |
| `@lobechat/chat-adapter-line` | `packages/chat-adapter-line/` | LINE 适配器 |

### 其他工具包

| 包名 | 路径 | 说明 |
|------|------|------|
| `@lobechat/ssrf-safe-fetch` | `packages/ssrf-safe-fetch/` | SSRF 安全的 fetch 封装 |
| `@lobechat/markdown-patch` | `packages/markdown-patch/` | Markdown 补丁工具 |
| `@lobechat/shared-tool-ui` | `packages/shared-tool-ui/` | 工具 UI 共享组件 |
| `@lobechat/observability-otel` | `packages/observability-otel/` | OpenTelemetry 可观测性 |
| `@lobechat/eval-rubric` | `packages/eval-rubric/` | 评估评分标准 |
| `@lobechat/edge-config` | `packages/edge-config/` | 边缘配置 |
| `@lobechat/app-config` | `packages/app-config/` | 应用配置 |
| `@lobechat/desktop-bridge` | `packages/desktop-bridge/` | 桌面端桥接 |
| `@lobechat/device-control` | `packages/device-control/` | 设备控制 |
| `@lobechat/device-identity` | `packages/device-identity/` | 设备身份 |
| `@lobechat/python-interpreter` | `packages/python-interpreter/` | Python 解释器 |
| `@lobechat/memory-user-memory` | `packages/memory-user-memory/` | 用户记忆模块 |
| `@lobechat/conversation-flow` | `packages/conversation-flow/` | 对话流解析 |

---

## 三、src/ - 主应用源码

### src/app/ - Next.js App Router

```
src/app/
├── [variants]/              # 动态路由变体
│   └── (auth)/              # 认证相关页面（SSR）
├── (backend)/               # 后端 API 路由
│   ├── api/                 # REST API
│   └── webapi/              # Web API（流式、文件上传等）
├── spa/                     # SPA HTML 模板服务
├── layout.tsx               # 根布局
├── manifest.ts              # PWA manifest
├── not-found.tsx            # 404 页面
└── robots.tsx               # SEO robots
```

### src/spa/ - SPA 入口与路由

```
src/spa/
├── entry.web.tsx            # Web 端入口
├── entry.mobile.tsx         # 移动端入口
├── entry.desktop.tsx        # 桌面端入口
├── entry.popup.tsx          # 弹窗入口
├── entry.auth.tsx           # 认证页入口
├── router/                  # React Router 配置
│   ├── desktopRouter.config.tsx
│   ├── desktopRouter.config.desktop.tsx
│   ├── mobileRouter.config.tsx
│   └── popupRouter.config.tsx
├── initialize/              # 应用初始化
├── atoms/                   # Jotai 原子状态
└── AppLayer.tsx             # 应用层级组件
```

**关键约定**：
- `desktopRouter.config.tsx` 和 `desktopRouter.config.desktop.tsx` 必须保持同步
- 路由树只定义页面结构，业务逻辑在 features 中

### src/routes/ - SPA 页面组件（路由层）

```
src/routes/
├── (main)/                  # 主页面组
│   ├── chat/
│   ├── discover/
│   ├── files/
│   ├── settings/
│   └── ...
├── (mobile)/                # 移动端页面
├── (desktop)/               # 桌面端专属页面
├── (popup)/                 # 弹窗页面
├── onboarding/              # 引导页
├── share/                   # 分享页面
└── verify-im/               # 即时通讯验证页
```

**约定**：每个路由目录只包含 `_layout/index.tsx` 和 `index.tsx`，业务逻辑委托给 features。

### src/features/ - 业务功能模块（40+）

这是最重要的目录，按业务领域组织：

| 模块 | 路径 | 说明 |
|------|------|------|
| **对话核心** | | |
| `Conversation` | `src/features/Conversation/` | 对话主界面（消息列表、输入、Markdown 渲染） |
| `ChatInput` | `src/features/ChatInput/` | 聊天输入框（编辑器、工具栏、附件） |
| `ChatMiniMap` | `src/features/ChatMiniMap/` | 对话迷你地图 |
| `CommandMenu` | `src/features/CommandMenu/` | 命令面板（K 快捷键） |
| **Agent 管理** | | |
| `AgentBuilder` | `src/features/AgentBuilder/` | Agent 创建/编辑 |
| `AgentSetting` | `src/features/AgentSetting/` | Agent 设置（元数据、提示词、插件、TTS） |
| `AgentHome` | `src/features/AgentHome/` | Agent 首页 |
| `AgentInfo` | `src/features/AgentInfo/` | Agent 信息卡片 |
| `AgentProfileCard` | `src/features/AgentProfileCard/` | Agent 资料卡片 |
| `AgentGroupAvatar` | `src/features/AgentGroupAvatar/` | Agent 群组头像 |
| `AgentDocumentsExplorer` | `src/features/AgentDocumentsExplorer/` | Agent 文档浏览器 |
| `AgentDocumentPage` | `src/features/AgentDocumentPage/` | Agent 文档页面 |
| **任务与工作流** | | |
| `AgentTasks` | `src/features/AgentTasks/` | Agent 任务管理 |
| `AgentTaskList` | `src/features/AgentTaskList/` | 任务列表 |
| `AgentTaskManager` | `src/features/AgentTaskManager/` | 任务管理器 |
| `AgentTopicManager` | `src/features/AgentTopicManager/` | Topic 管理器 |
| `Fleet` | `src/features/Fleet/` | Fleet 多 Agent 协作看板 |
| **内容创作** | | |
| `PageEditor` | `src/features/PageEditor/` | Page 编辑器（文档协作） |
| `EditorCanvas` | `src/features/EditorCanvas/` | 编辑器画布 |
| `EditorModal` | `src/features/EditorModal/` | 编辑器弹窗 |
| `Pages` | `src/features/Pages/` | Pages 页面布局 |
| `PageExplorer` | `src/features/PageExplorer/` | 页面资源管理器 |
| `DocumentModal` | `src/features/DocumentModal/` | 文档预览弹窗 |
| **文件管理** | | |
| `FileTree` | `src/features/FileTree/` | 文件树 |
| `FileViewer` | `src/features/FileViewer/` | 文件查看器（代码、HTML、PDF） |
| `FileSidePanel` | `src/features/FileSidePanel/` | 文件侧边栏 |
| `ExplorerTree` | `src/features/ExplorerTree/` | 资源管理器树 |
| `LocalFile` | `src/features/LocalFile/` | 本地文件 |
| `DataImporter` | `src/features/DataImporter/` | 数据导入 |
| **MCP 与插件** | | |
| `MCP` | `src/features/MCP/` | MCP 插件管理 |
| `MCPPluginDetail` | `src/features/MCPPluginDetail/` | MCP 插件详情 |
| `PluginDetailModal` | `src/features/PluginDetailModal/` | 插件详情弹窗 |
| `PluginDevModal` | `src/features/PluginDevModal/` | 插件开发弹窗 |
| `PluginSettings` | `src/features/PluginSettings/` | 插件设置 |
| `PluginTag` | `src/features/PluginTag/` | 插件标签 |
| `PluginAvatar` | `src/features/PluginAvatar/` | 插件头像 |
| `Connectors` | `src/features/Connectors/` | 连接器列表 |
| **模型与设置** | | |
| `ModelSelect` | `src/features/ModelSelect/` | 模型选择器 |
| `ModelSwitchPanel` | `src/features/ModelSwitchPanel/` | 模型切换面板 |
| `ModelParamsControl` | `src/features/ModelParamsControl/` | 模型参数控制 |
| `OllamaModelDownloader` | `src/features/OllamaModelDownloader/` | Ollama 模型下载 |
| `OllamaSetupGuide` | `src/features/OllamaSetupGuide/` | Ollama 安装向导 |
| **导航与布局** | | |
| `NavPanel` | `src/features/NavPanel/` | 导航面板（侧边栏） |
| `NavHeader` | `src/features/NavHeader/` | 导航头部 |
| `MobileTabBar` | `src/features/MobileTabBar/` | 移动端底部标签栏 |
| `MobileSwitchLoading` | `src/features/MobileSwitchLoading/` | 移动端切换加载 |
| `Electron` | `src/features/Electron/` | Electron 桌面端 UI（标题栏、标签栏等） |
| **Messenger** | | |
| `Messenger` | `src/features/Messenger/` | Messenger 集成（Discord/Slack/Telegram） |
| **认证** | | |
| `Auth` | `src/features/Auth/` | 认证模块（登录、注册、OAuth、重置密码） |
| `AuthCard` | `src/features/AuthCard/` | 认证卡片 |
| `AuthShell` | `src/features/AuthShell/` | 认证外壳 |
| **引导与欢迎** | | |
| `Onboarding` | `src/features/Onboarding/` | 用户引导 |
| `DailyBrief` | `src/features/DailyBrief/` | 每日简报 |
| **其他功能** | | |
| `Follow` | `src/features/Follow/` | 关注功能 |
| `HeterogeneousTag` | `src/features/HeterogeneousTag/` | 异构 Agent 标签 |
| `HotkeyHelperPanel` | `src/features/HotkeyHelperPanel/` | 快捷键帮助面板 |
| `PWAInstall` | `src/features/PWAInstall/` | PWA 安装提示 |
| `OpenInAppButton` | `src/features/OpenInAppButton/` | 应用内打开按钮 |
| `DeviceManager` | `src/features/DeviceManager/` | 设备管理器 |
| `Billboard` | `src/features/Billboard/` | 公告/横幅 |
| `ChangelogModal` | `src/features/ChangelogModal/` | 更新日志弹窗 |
| `AlertBanner` | `src/features/AlertBanner/` | 警告横幅 |
| `AvatarWithUpload` | `src/features/AvatarWithUpload/` | 带头像上传的组件 |
| `FloatingChatPanel` | `src/features/FloatingChatPanel/` | 浮动聊天面板 |
| `EditingPopover` | `src/features/EditingPopover/` | 编辑弹出框 |
| `EditLock` | `src/features/EditLock/` | 编辑锁 |
| `AgentSkillDetail` | `src/features/AgentSkillDetail/` | Skill 详情 |
| `AgentSkillEdit` | `src/features/AgentSkillEdit/` | Skill 编辑 |
| `AgentMockDevtools` | `src/features/AgentMockDevtools/` | Agent 模拟开发工具 |
| `LibraryModal` | `src/features/LibraryModal/` | 资源库弹窗 |
| `GroupAvatar` | `src/features/GroupAvatar/` | 群组头像 |
| `GroupInfo` | `src/features/GroupInfo/` | 群组信息 |
| `DevPanel` | `src/features/DevPanel/` | 开发调试面板 |
| `DevFeatureFlagPanel` | `src/features/DevFeatureFlagPanel/` | 特性开关面板 |
| `PlanIcon` | `src/features/PlanIcon/` | 套餐图标 |
| `ToolTag` | `src/features/ToolTag/` | 工具标签 |
| `AttachmentInput` | `src/features/AttachmentInput/` | 附件输入 |
| `CreatePlatformAgent` | `src/features/CreatePlatformAgent/` | 创建平台 Agent |
| `DesktopFileMenuBridge` | `src/features/DesktopFileMenuBridge/` | 桌面端文件菜单桥接 |
| `DesktopNavigationBridge` | `src/features/DesktopNavigationBridge/` | 桌面端导航桥接 |
| `Portal` | `src/features/Portal/` | Portal 入口 |
| `User` | `src/features/User/` | 用户相关组件 |
| `Verify` | `src/features/Verify/` | 验证模块 |
| `Setting` | `src/features/Setting/` | 设置页脚等通用组件 |
| `RouteMeta` | `src/features/RouteMeta/` | 路由元信息 |

### src/store/ - Zustand 状态管理

```
src/store/
├── agent/                   # Agent 状态
├── agentGroup/              # Agent 群组状态
├── chat/                    # 聊天状态
├── session/                 # 会话状态
├── topic/                   # 主题状态
├── message/                 # 消息状态
├── user/                    # 用户状态
├── file/                    # 文件状态
├── tool/                    # 工具状态
├── task/                    # 任务状态
├── page/                    # 页面状态
├── document/                # 文档状态
├── global/                  # 全局状态
├── device/                  # 设备状态
├── discover/                # 发现页状态
├── home/                    # 首页状态
├── brief/                   # 简报状态
├── image/                   # 图片状态
├── video/                   # 视频状态
├── notebook/                # 笔记本状态
├── library/                 # 资源库状态
├── mention/                 # @提及状态
├── tree/                    # 树状态
├── aiInfra/                 # AI 基础设施状态
├── serverConfig/            # 服务端配置状态
├── userMemory/              # 用户记忆状态
├── eval/                    # 评估状态
├── verify/                  # 验证状态
├── electron/                # Electron 状态
├── middleware/              # 中间件
├── types.ts                 # 类型定义
└── test-coverage.md         # 测试覆盖率说明
```

### src/services/ - 客户端服务（API 层）

```
src/services/
├── _auth.ts                 # 认证请求封装
├── _header.ts               # 请求头
├── _url.ts                  # URL 工具
├── chat/                    # 聊天服务
├── agent.ts                 # Agent 服务
├── aiAgent.ts               # AI Agent 服务
├── aiChat.ts                # AI 聊天服务
├── aiModel/                 # AI 模型服务
├── chatGroup/               # 聊天群组服务
├── session/                 # 会话服务
├── topic/                   # 主题服务
├── thread/                  # 线程服务
├── message/                 # 消息服务
├── user/                    # 用户服务
├── file/                    # 文件服务
├── document/                # 文档服务
├── plugin/                  # 插件服务
├── skill/                   # Skill 服务
├── tool.ts                  # 工具服务
├── mcp.ts                   # MCP 服务
├── config.ts                # 配置服务
├── generation.ts            # 生成服务
├── image.ts                 # 图片服务
├── video.ts                 # 视频服务
├── knowledgeBase.ts         # 知识库服务
├── rag.ts                   # RAG 服务
├── search.ts                # 搜索服务
├── share.ts                 # 分享服务
├── task.ts                  # 任务服务
├── recent/                  # 最近访问服务
├── home/                    # 首页服务
├── brief.ts                 # 简报服务
├── trace.ts                 # 追踪服务
├── usage.ts                 # 用量服务
├── upload.ts                # 上传服务
├── export/                  # 导出服务
├── import/                  # 导入服务
├── notification.ts          # 通知服务
├── social.ts                # 社交服务
├── verify.ts                # 验证服务
├── device.ts                # 设备服务
├── github.ts                # GitHub 服务
├── git.ts                   # Git 服务
├── marketApi.ts             # 市场 API
├── discover.ts              # 发现页服务
├── models.ts                # 模型服务
├── global.ts                # 全局服务
├── debug.ts                 # 调试服务
├── cloudSandbox.ts          # 云沙箱服务
├── followUpAction.ts        # 后续操作服务
├── generationBatch.ts       # 批量生成服务
├── generationTopic.ts       # Topic 生成服务
├── messenger.ts             # Messenger 服务
├── notebook.ts              # 笔记本服务
├── projectFile.ts           # 项目文件服务
├── projectSkill.ts          # 项目 Skill 服务
├── python.ts                # Python 服务
├── ragEval.ts               # RAG 评估服务
├── resource/                # 资源服务
├── userMemory/              # 用户记忆服务
├── webBrowsing.ts           # 网页浏览服务
└── electron/                # Electron 服务
```

### src/server/ - 服务端模块

```
src/server/
├── agent-hono/              # Agent Hono 服务（Bot、Messenger、Webhook）
│   ├── handlers/            # 处理器
│   └── middlewares/         # 中间件
├── workflows-hono/          # 工作流 Hono 服务
│   ├── agent-signal/        # Agent 信号工作流
│   ├── memory-user-memory/  # 用户记忆工作流
│   ├── task/                # 任务工作流
│   └── verify/              # 验证工作流
├── services/                # 服务端服务
│   └── composio/            # Composio 集成
├── ld.ts                    # LaunchDarkly 特性开关
├── manifest.ts              # 清单生成
├── metadata.ts              # 元数据
├── spaHtml.ts               # SPA HTML 模板
└── translation.ts           # 翻译服务
```

### src/business/ - 商业版（SaaS）专属代码

```
src/business/
└── client/
    ├── BusinessSettingPages/    # 商业版设置页面
    │   ├── Plans.tsx            # 套餐页
    │   ├── Billing.tsx          # 账单页
    │   ├── Credits.tsx          # 积分页
    │   ├── Usage.tsx            # 用量页
    │   ├── Referral.tsx         # 推荐页
    │   ├── WorkspaceBilling*.tsx # 工作区计费相关
    │   ├── WorkspaceGeneral.tsx  # 工作区常规设置
    │   ├── WorkspaceMembers.tsx  # 工作区成员
    │   └── Notification.tsx      # 通知设置
    ├── features/                # 商业版功能组件
    ├── hooks/                   # 商业版 Hooks
    ├── services/                # 商业版服务
    ├── model-bank/              # 商业版模型库
    ├── BusinessAuthProvider.tsx # 商业版认证 Provider
    ├── BusinessGlobalProvider.tsx # 商业版全局 Provider
    ├── BusinessDesktopRoutes.tsx # 桌面端路由扩展
    ├── BusinessMobileRoutes.tsx  # 移动端路由扩展
    └── ...
```

### src/components/ - 通用 UI 组件

```
src/components/
├── 404/
├── Analytics/
├── Cell/
├── Error/
├── GoBack/
├── Loading/
├── Menu/
├── mdx/
├── Link.tsx
├── AuthIcons.tsx
├── RingLoading.tsx
├── StopLoading.tsx
├── TodoList.tsx
└── withSuspense.tsx
```

### src/hooks/ - 通用 Hooks

```
src/hooks/
├── useGreeting/
├── useHotkeys/
├── useActiveTabKey.ts
├── useActivityTime.ts
├── useAutoScroll.ts
├── useDownloadImage.ts
├── useEnterToSend.ts
├── useFetchAgentList.ts
├── useFetchChatTopics.ts
├── useFetchSessions.ts
├── useHomeDailyBrief.ts
├── useIsDark.ts
├── useIsMobile.ts
├── usePermission.ts
├── usePlatform.ts
├── usePWAInstall.ts
├── useQuery.ts
├── useScreenshot.ts
├── useShare.tsx
├── useStableNavigate.ts
├── useTTS.ts
├── useTokenCount.ts
├── useUserAvatar.ts
├── useWorkspaceModal.tsx
└── ...
```

### src/libs/ - 第三方库集成

```
src/libs/
├── analytics/                # 分析服务
├── better-auth/              # Better Auth 认证
├── composio/                 # Composio 集成
├── editor/                   # 编辑器相关
├── mcp/                      # MCP 客户端
├── next/                     # Next.js 工具
├── oidc-provider/            # OIDC 提供者
├── pdfjs/                    # PDF.js
├── qstash/                   # QStash 队列
├── redis/                    # Redis 客户端
├── router/                   # 路由工具
├── swr/                      # SWR 封装
├── traces/                   # 追踪
└── debug-file-logger.ts
```

### src/utils/ - 工具函数

```
src/utils/
├── client/                   # 客户端工具
├── server/                   # 服务端工具
├── electron/                 # Electron 工具
├── rbac.ts                   # RBAC 工具
├── errorResponse.ts          # 错误响应
├── identifier.ts             # 标识符
├── locale.ts                 # 国际化
├── markdownToTxt.ts          # Markdown 转文本
├── navigation.ts             # 导航
├── platform.ts               # 平台判断
├── skillMarkdown.ts          # Skill Markdown
├── unzipFile.ts              # 解压文件
└── ...
```

### src/styles/ - 全局样式

```
src/styles/
├── antdOverride.ts           # Ant Design 覆盖
├── global.ts                 # 全局样式
├── loading.ts                # 加载样式
├── text.ts                   # 文本样式
└── mobileHeader.ts           # 移动端头部样式
```

### src/locales/ - 国际化

```
src/locales/
├── default/                  # 默认（源）语言
│   ├── agent.ts
│   ├── auth.ts
│   ├── chat.ts
│   ├── setting.ts
│   └── ...
├── en-US/                    # 英语
├── zh-CN/                    # 简体中文
└── ...
```

---

## 四、其他重要目录

| 目录 | 说明 |
|------|------|
| `docker-compose/` | Docker Compose 部署配置（dev、prod 等） |
| `docs/` | 项目文档 |
| `e2e/` | E2E 测试（Cucumber + Playwright） |
| `.agents/` | Agent 技能定义 |
| `.cursor/` | Cursor 编辑器配置 |
| `.github/` | GitHub Actions 工作流 |

---

## 五、关键开发约定

### 路由与功能分离

- **路由层** (`src/routes/`)：只放页面段文件（`_layout/index.tsx`、`index.tsx`）
- **功能层** (`src/features/`)：业务逻辑和 UI 组件
- 路由文件只从 `@/features/*` 导入，不写业务逻辑

### 状态管理

- 使用 Zustand，按领域拆分 store
- 每个 store 包含 `index.ts`、`store.ts`、`selectors.ts`、`initialState.ts`
- 优先使用 selector 避免不必要的重渲染

### 组件优先级

1. 项目组件（`src/components/`）
2. `@lobehub/ui/base-ui`（无头组件）
3. `@lobehub/ui`
4. Ant Design

### 样式方案

- 优先使用 `createStaticStyles` + `cssVar.*`（零运行时）
- 仅在需要动态计算时使用 `createStyles` + `token`

### 包导入路径

```typescript
// 正确
import { X } from '@/features/Domain'
import { useX } from '@/hooks/useX'

// 从 packages 导入
import { PERMISSION_ACTIONS } from '@lobechat/const'
```

---

## 六、快速定位参考

| 需求 | 查找位置 |
|------|---------|
| 新增页面路由 | `src/routes/` + `src/spa/router/` |
| 新增业务功能 | `src/features/<Domain>/` |
| 修改数据库表 | `packages/database/src/schemas/` |
| 添加 API 接口 | `src/server/routers/` 或 `packages/business-server/src/lambda-routers/` |
| 权限控制 | `packages/const/src/rbac.ts` |
| 修改设置项 | `packages/const/src/settings/` |
| 国际化文案 | `src/locales/default/` |
| 新增 AI 模型 | `packages/model-bank/src/aiModels/` |
| 订阅/计费逻辑 | `packages/business-server/src/lambda-routers/subscription.ts` |
| 商业版前端 | `src/business/client/` |
