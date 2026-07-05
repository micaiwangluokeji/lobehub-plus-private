---
name: auth-permission-comparison-doc
overview: 对比 LifeOS (BuildingAI) 和 LobeHub 的用户认证与权限体系，编写一份详细的对比分析文档。
todos:
  - id: write-auth-permission-comparison-doc
    content: 根据已有的 LifeOS 和 LobeHub 源码分析数据，撰写认证与权限系统对比文档，存入 docs/research/auth-permission-comparison.md。包含认证体系、用户模型、新用户默认角色、RBAC 结构、超级管理员机制、优缺点分析，并使用 Mermaid 图展示权限检查链路。遵循已有的架构对比文档风格。
    status: pending
---

## 需求概述

撰写一份 LifeOS (BuildingAI) 与 LobeHub 的认证与权限系统全面对比文档，包含以下内容：

1. **认证体系对比**：注册流程、登录方式、令牌管理、密码加密
2. **用户模型对比**：用户表字段设计、权限相关字段
3. **新用户默认角色和权限对比**：注册后自动获得什么角色？有哪些权限？
4. **权限模型（RBAC）结构对比**：表结构、权限编码格式、检查链路
5. **超级管理员机制对比**：isRoot、super_admin 角色等
6. **优缺点分析**：各自的设计优劣
7. **总结与适用场景建议**

## 输入数据

已有子代理完成的全量源码分析结果：

- LifeOS: 基于 `~/Downloads/BuildingAI/` 项目的 NestJS + TypeORM + JWT 权限系统
- LobeHub: 基于 `/Users/guoshenghui/Downloads/lobehub-plus-main/` 项目的 Next.js + Better Auth + Drizzle RBAC 权限系统

## 输出文件

`/Users/guoshenghui/Downloads/lobehub-plus-main/docs/research/auth-permission-comparison.md`

## 技术方案

### 实施方法

直接用文件写入方式生成对比文档，不涉及代码修改或运行环境。

### 文件格式

Markdown 格式，使用表格对比、流程图展示权限检查链路，遵循与已有架构对比文档（`architecture-comparison-lifeos-vs-lobehub.md`）相同的风格和规范。

### 文档结构

1. 概述（项目概览对比表）
2. 认证体系对比（注册、登录、令牌）
3. 用户模型对比（用户表权限相关字段）
4. 新用户默认角色与权限对比
5. RBAC 权限模型结构对比（表结构、权限编码、粒度）
6. 超级管理员机制对比
7. 权限检查链路对比（含 Mermaid 流程图）
8. 优缺点分析
9. 总结与适用场景建议

### 关键内容要点

#### LifeOS 侧

- 技术栈：NestJS 11 + TypeORM + JWT + bcryptjs
- 认证方式：JWT (30天过期，双级缓存+滑动刷新)
- 注册来源：支持邮箱密码、手机验证码、微信登录多种方式
- 新用户默认：**无角色、无权限**（权限完全由管理员分配）
- 权限模型：2 表 RBAC（Role + Permission）+ 用户直接权限（user_permissions 关联表）
- 权限格式：`group:action`（如 `users:list`, `role:create`）
- 超级管理员：`isRoot=YES` 字段短路
- 守卫链：AuthGuard → PermissionsGuard → SuperAdminGuard → MemberOnlyGuard
- 权限自动发现：控制器装饰器扫描，系统启动时自动同步到数据库

#### LobeHub 侧

- 技术栈：Next.js 16 + Better Auth + Drizzle ORM + PostgreSQL
- 认证方式：Better Auth Session（cookie-based，支持邮箱密码/Magic Link/OAuth/Passkey/OTP）
- 新用户默认：**自动分配 `free_user` 角色**（只能管理自己的 Agent）
- 权限模型：4 表 RBAC（roles + permissions + role_permissions + user_roles），支持系统级和工作区级
- 权限格式：`resource:action:scope`（如 `agent:create:all`, `session:read:owner`），约 60 个权限代码
- 超级管理员：双重机制——a) `isRoot` 布尔字段短路；b) `super_admin` 角色（拥有全部 `:all` 权限）
- 中间件链：oidcAuth → userAuth → withRbacPermission
- 种子数据：系统预置 3 个角色（super_admin/vip_user/free_user）+ 3 个工作区角色（owner/member/viewer）