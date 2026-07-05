---
name: auth-permission-comparison-doc
overview: 对比 LifeOS (BuildingAI) 和 LobeHub 的用户认证、权限体系、商业化功能与运营功能，编写一份全面的对比分析文档。
todos:
  - id: write-comparison-doc
    content: 根据已完成的 LifeOS 和 LobeHub 全量源码分析数据，撰写完整的认证/权限/商业化三维对比文档，存入 docs/research/auth-permission-comparison.md。包含所有表格、Mermaid 流程图、优缺点分析和总结建议。遵循已有架构对比文档风格。
    status: completed
---

## 需求概述

撰写 LifeOS (BuildingAI) 与 LobeHub 在三大维度的全面对比分析文档：

1. **认证体系**：注册流程、登录方式、令牌管理、密码加密、OAuth 集成
2. **权限模型**：用户模型字段、新用户默认角色、RBAC 结构、权限编码格式、超级管理员机制、权限检查链路
3. **商业化与运营功能**：支付系统（微信/支付宝/Stripe）、会员套餐/订阅、积分系统、消费追踪、收入仪表盘、通知系统、审计日志、健康监控、系统配置管理、扩展机制

## 输出文件

`docs/research/auth-permission-comparison.md`

## 文档风格

遵循已有的架构对比文档（`docs/research/architecture-comparison-lifeos-vs-lobehub.md`）风格：采用 Markdown 格式、表格对比、Mermaid 流程图展示权限检查链路、分优缺点分析和总结建议。

## 技术方案

### 实施方法

直接使用文件写入方式生成对比文档，不涉及代码修改或运行环境变更。

### 文档结构

1. **总体对比**（项目概览表）
2. **认证体系对比**

- 技术栈对比
- 注册与登录方式
- 令牌管理与会话机制
- OAuth/SSO 集成

3. **用户模型对比**

- 用户表权限相关字段
- 用户-角色关系设计

4. **新用户默认角色与权限对比**
5. **RBAC 权限模型对比**

- 表结构（2表 vs 4表）
- 权限编码格式（group:action vs resource:action:scope）
- 权限粒度
- 工作区级权限

6. **超级管理员机制对比**

- isRoot 短路（共同点）
- LobeHub 额外 super_admin 角色

7. **权限检查链路对比**（含 Mermaid 时序图）
8. **商业化功能对比**

- 支付系统（微信/支付宝集成深度）
- 会员套餐与订阅
- 积分系统
- AI 消费追踪
- 收入分析

9. **运营功能对比**

- 通知系统
- 审计日志
- 健康监控
- 系统配置
- 内容审核
- 字典配置（LifeOS 特有）
- 扩展机制

10. **优缺点分析**
11. **总结与适用场景建议**

### 关键数据来源

- LifeOS: `~/Downloads/BuildingAI/` 项目源码（NestJS + TypeORM + JWT）
- LobeHub: `/Users/guoshenghui/Downloads/lobehub-plus-main/` 项目源码（Next.js + Better Auth + Drizzle ORM）

## 使用的子代理

### code-explorer

- **用途**：深度探索 LifeOS 和 LobeHub 的认证、权限、商业化相关源码
- **成果**：已完成两个项目的全量代码分析，覆盖认证流程、用户模型、RBAC 表结构、支付模块、订阅系统、积分系统、运营功能等所有模块

### bmad-architect

- **用途**：用于构建文档的架构对比部分，确保对比维度的系统性和完整性
- **预期产出**：结构化的对比框架和评估标准

## 使用的技能

### 前端开发 / 全栈开发（参考）

- 用于理解两个项目的前后端交互模式，确保认证流程描述的准确性