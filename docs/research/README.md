# LobeHub 项目调研总览

## 项目概述

LobeHub 是一个开源的 **AI Agent 运营平台**（Chief Agent Operator），帮助用户将专属 Agent 组织成 7×24 不打烊的高效队伍。

- **GitHub**: https://github.com/lobehub/lobehub
- **官方网站**: https://lobehub.com
- **文档**: https://lobehub.com/docs
- **开源协议**: MIT
- **Star 数**: 79.2K

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Next.js 16 + React 19 + TypeScript |
| 构建工具 | Vite（SPA）+ Next.js build |
| UI 组件库 | @lobehub/ui + Ant Design + antd-style |
| 状态管理 | Zustand |
| 数据请求 | SWR + tRPC（端到端类型安全） |
| 路由 | React Router（SPA 主路由）+ Next.js App Router（认证页/API） |
| 数据库 | PostgreSQL + Drizzle ORM |
| 缓存/会话 | Redis |
| 对象存储 | S3 兼容（RustFS/MinIO） |
| 搜索引擎 | SearXNG（可选） |
| 国际化 | react-i18next |
| 测试 | Vitest（单元测试）+ Playwright（E2E） |
| 桌面端 | Electron |
| 包管理 | pnpm + bun |
| 代码规范 | ESLint + Prettier + Stylelint |

## 核心功能

### AI 对话与 Agent
- 多模型支持（40+ AI 提供商）
- Agent 创建与管理
- Agent 记忆系统
- Agent 群组协作

### 内容创作
- Pages 协作写作
- 文档编辑（基于 @lobehub/editor）
- Markdown 支持

### 生产力工具
- 任务管理
- 日程安排
- 每日简报

### 扩展能力
- MCP（Model Context Protocol）插件
- 1万+ Skills
- 插件市场

## 项目结构

```
lobehub/
├── apps/                    # 独立应用
│   ├── desktop/             # Electron 桌面端
│   ├── cli/                 # LobeHub CLI
│   └── server/              # 服务端应用
├── packages/                # 共享包（@lobechat/* 命名空间）
│   ├── database/            # 数据库层（Drizzle ORM）
│   ├── agent-runtime/       # Agent 运行时
│   ├── model-runtime/       # 模型运行时
│   ├── trpc/                # tRPC 客户端/服务端
│   ├── const/               # 常量定义
│   ├── types/               # 类型定义
│   └── ...
├── src/
│   ├── app/                 # Next.js App Router
│   │   └── (backend)/       # 后端 API 路由
│   ├── business/            # 商业版（SaaS）专属代码
│   ├── components/          # 通用 UI 组件
│   ├── features/            # 业务功能模块（40+）
│   ├── layout/              # 布局组件
│   ├── libs/                # 第三方库集成
│   ├── locales/             # 国际化文件
│   ├── server/              # 服务端模块
│   ├── services/            # 客户端服务
│   ├── spa/                 # SPA 入口和路由
│   ├── store/               # Zustand 状态管理
│   └── utils/               # 工具函数
├── docker-compose/          # Docker 部署配置
└── docs/                    # 文档
```

## 开发环境

### 本地开发命令

| 命令 | 说明 | 端口 |
|------|------|------|
| `bun run dev:spa` | 仅前端 SPA 开发 | 9876 |
| `bun run dev` | 全栈开发 | 3010 |
| `bun run dev:docker` | 启动 Docker 依赖服务 | - |
| `bun run dev:spa:mobile` | 移动端开发 | 3012 |

### Docker 依赖服务

| 服务 | 端口 | 用途 |
|------|------|------|
| PostgreSQL | 5432 | 主数据库 |
| Redis | 6379 | 缓存/会话 |
| RustFS | 9000/9001 | S3 对象存储 |
| SearXNG | 8180 | 搜索引擎 |

## 文档导航

### 📚 基础篇

| 文档 | 说明 |
|------|------|
| [架构设计](./architecture.md) | 应用架构总览、前端架构、后端 API、运行时、认证、数据存储 |
| [目录结构详解](./folder-structure.md) | 完整的目录结构说明、模块职责、开发约定、快速定位参考 |

### 🔐 权限与安全

| 文档 | 说明 |
|------|------|
| [RBAC 权限系统](./rbac-permissions.md) | 系统级/工作区级角色、权限资源分类、数据库表结构、开发建议 |
| [超级管理员后台分析](./admin-backend-analysis.md) | 管理后台现状、已有能力、功能对比、开发方案、推荐路线 |

### 💰 订阅与计费

| 文档 | 说明 |
|------|------|
| [订阅与计费系统调研](./subscription-billing.md) | 系统现状、套餐体系、积分系统、支付接入、管理后台规划 |

### 🚀 二次开发

| 文档 | 说明 |
|------|------|
| [二次开发评估与建议](./secondary-development-guide.md) | 技术栈评估、开发难度、扩展点分析、SaaS 化改造、团队建议 |

## 核心结论速览

### 1. 超级管理员后台
**❌ 开源版没有可视化管理后台**
- 后端 RBAC 系统已完整实现
- 前端管理界面完全缺失，需要从零开发
- 预计开发周期：10-14 周（含订阅、支付、统计等）

### 2. 订阅与计费系统
**❌ 开源版没有订阅计费功能**
- 前端页面使用 iframe 嵌入官方网站（仅云模式）
- 服务端路由为空实现（stub）
- 数据库无相关表
- 完全自研预计 8-12 周

### 3. 二次开发友好度
**⭐⭐⭐⭐（4/5）- 非常适合二次开发**
- 代码质量高，架构清晰
- TypeScript 全链路类型安全
- 模块化好，扩展点多
- 商业版代码有预留接口，便于扩展

### 4. SaaS 化可行性
**✅ 完全可行**
- 底层工作区隔离已就绪
- RBAC 权限系统完整
- 用户系统完善
- 主要工作量在管理后台和支付系统
