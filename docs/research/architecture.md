# LobeHub 架构设计

## 应用架构总览

LobeHub 整体架构由以下核心层组成：

```
+---------------------+--------------------------------------------------+
| Layer               | Description                                      |
+---------------------+--------------------------------------------------+
| Frontend            | Next.js RSC + React Router DOM hybrid SPA       |
| Backend API         | Next.js Route Handlers + tRPC edge routers       |
| Runtime             | Model Runtime + Agent Runtime                    |
| Marketplace         | Agent / Plugin / Model discovery services        |
| Data Storage        | PostgreSQL + Redis + S3-compatible object store  |
| Deployment          | Vercel / Docker / Kubernetes                     |
+---------------------+--------------------------------------------------+
```

## 前端架构

前端使用 Next.js 框架，采用 **Next.js RSC + React Router DOM 混合路由方案**：

| 路由方案 | 用途 | 位置 |
|---------|------|------|
| React Router DOM | 主聊天 SPA、Agent 界面 | `src/spa/` + `src/routes/` |
| Next.js App Router | 认证页、SEO 页面、API 路由 | `src/app/` |

**为什么混合路由？**
- SSR 提供认证页面安全性、SEO 和静态页面性能
- SPA 提供即时导航和响应式状态，适合交互式聊天和 Agent 界面
- 两者结合，各取所长

### 组件优先级

构建 UI 时的组件优先级：
1. 项目组件（`src/components/`）
2. `@lobehub/ui`
3. Ant Design（`antd`）

始终优先使用项目级组件以保持一致性。

## 后端 API

后端提供两种 API 风格：

### 1. Web API（REST）
- 位置：`src/app/(backend)/webapi/`
- 用途：流式聊天、文件上传、Webhook 等

### 2. tRPC（类型安全 RPC）
- 位置：`src/server/routers/`
- 包含：
  - **Lambda Router**: 核心业务接口（Agent、会话、消息等）
  - **Files Router**: 文件管理
  - **Market Router**: 市场数据
  - **Desktop Router**: 桌面端专属

## 运行时（Runtime）

### Model Runtime（模型运行时）
- 位置：`packages/model-runtime/`
- 作用：LLM API 适配层
- 功能：统一 30+ AI 提供商（OpenAI、Anthropic、Google、Bedrock、Ollama 等）的 API 差异
- 能力：
  - 流式聊天 (`chat`)
  - 模型列表 (`models`)
  - 文本嵌入 (`embeddings`)
  - 图像生成 (`createImage`)
  - 语音合成 (`textToSpeech`)
  - 结构化输出 (`generateObject`)

### Agent Runtime（Agent 运行时）
- 位置：`packages/agent-runtime/`
- 作用：Agent 编排引擎，位于 Model Runtime 之上
- 驱动多步骤 AI Agent 行为的完整生命周期：
  1. `call_llm`: 调用大模型
  2. `call_tool`: 执行工具调用
  3. `finish`: 结束对话
  4. `compress_context`: 上下文压缩
  5. `request_human_approve` / `request_human_prompt` / `request_human_select`: 请求人工干预
  6. `GroupOrchestrationRuntime`: 多 Agent 编排

**简而言之**：Model Runtime 处理"如何与 LLM 提供商通信"；Agent Runtime 处理"如何使用 LLM、工具和人工审批运行完整的 Agent"。

## 认证（Authentication）

LobeHub 使用 **Better Auth** 作为认证框架，支持：
- 邮箱 + 密码登录
- 20+ SSO 提供商（Google、GitHub、Microsoft 等）
- OAuth/OIDC

认证配置在 `src/auth.ts`，相关路由在 `src/app/(backend)/api/`。

## 数据存储

```
+---------------+----------------------------------------------+
| Storage       | Usage                                        |
+---------------+----------------------------------------------+
| PostgreSQL    | 主数据库：用户、会话、消息、Agent 等          |
| Redis         | 会话缓存、速率限制、队列                      |
| S3 (RustFS)   | 文件存储：头像、附件、图片等                  |
+---------------+----------------------------------------------+
```

数据库操作使用 Drizzle ORM，Schema 定义在 `packages/database/src/schemas/`。

## 性能优化

- 流式响应（SSE）
- 虚拟滚动（长列表）
- 代码分割（按路由）
- 图片懒加载
- 缓存策略（SWR + Redis）
- Edge Runtime（tRPC）

## 安全措施

- Better Auth 认证
- RBAC 权限系统
- API Key 加密存储
- 内容审核
- CORS 配置
- 速率限制

## 开发与部署

- 本地开发：`bun run dev`
- 构建：`bun run build`
- 部署方式：Vercel / Docker / Sealos / 阿里云
