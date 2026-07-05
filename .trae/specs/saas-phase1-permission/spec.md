# SaaS 改造阶段一：权限管控与官方智能体商店 - Product Requirement Document

## Overview
- **Summary**: 基于 LobeHub 个人版进行 SaaS 化改造，实现用户角色权限体系、智能体创建权限控制、官方智能体商店三大核心能力，构建面向 C 端用户的智能体平台基础。
- **Purpose**: 解决开源版本中所有用户权限平等、无法管控智能体创建、缺乏官方内容运营渠道的问题，为后续商业化（订阅、付费、积分）奠定基础。
- **Target Users**: 
  - 平台管理员（超级管理员）：运营平台、创建官方智能体、管理用户
  - 免费用户：使用官方智能体，无创建权限
  - VIP 用户（预留）：可创建自有智能体，更多高级功能

## Goals
- 建立三级用户角色体系（super_admin / vip_user / free_user）
- 实现智能体创建的权限控制，免费用户无法创建智能体
- 建立官方智能体商店，管理员可发布智能体给所有用户使用
- 用户数据严格隔离，每个用户只能看到自己的聊天记录和配置
- 保留工作区功能作为后续团队版高级功能

## Non-Goals (Out of Scope)
- 支付集成（微信/支付宝/Stripe）
- 订阅套餐和计费系统
- 积分/额度系统
- 完整的管理员后台 UI（本期先通过数据库 + 简单接口操作）
- 工作区级别的权限细化（本期聚焦个人空间）
- 智能体群组（Agent Group）功能（本期先做单智能体）

## Background & Context
- LobeHub 开源版本采用工作区 + 个人空间双轨制，所有注册用户权限平等
- 已有完整的 RBAC 权限模型基础（rbac_roles、rbac_permissions、rbac_user_roles）
- 已有智能体发布/分享机制（agent_shares 表），可复用于官方商店
- 智能体表（agents）已有 user_id 和 workspace_id 字段，支持数据隔离
- 已有发现页（/discover）框架，可改造为官方智能体商店

## Functional Requirements

### FR-1: 用户角色体系
- 系统支持三种全局角色：super_admin（超级管理员）、vip_user（付费会员）、free_user（免费用户）
- 新注册用户默认分配 free_user 角色
- 超级管理员拥有所有权限
- 角色信息存储在 RBAC 系统中，通过 rbac_user_roles 关联用户

### FR-2: 智能体创建权限控制
- free_user 角色无智能体创建权限
- vip_user 和 super_admin 角色可创建智能体
- 前端：无权限时隐藏「创建智能体」按钮和入口
- 后端：创建智能体的 API 增加权限校验，无权限返回 403
- 权限控制覆盖个人空间和工作区

### FR-3: 官方智能体商店
- 超级管理员可将自有智能体发布为「官方智能体」
- 官方智能体在「发现」页展示，所有用户可见
- 用户可「安装/使用」官方智能体到自己的空间
- 安装本质是复制一份智能体配置到用户个人空间
- 官方智能体支持分类、标签、搜索

### FR-4: 数据隔离
- 每个用户只能看到自己创建的和安装的智能体
- 聊天记录、设置、文件等数据按 user_id 严格隔离
- 官方智能体源数据只有管理员可编辑，用户只能读取和复制

### FR-5: 管理员能力
- super_admin 可访问所有官方智能体管理功能
- 可发布/下架官方智能体
- 可设置智能体为推荐/热门
- （本期暂不做完整 UI，通过数据库操作 + 简单接口实现）

## Non-Functional Requirements

- **NFR-1**: 权限校验必须在后端强制执行，前端隐藏只是体验优化
- **NFR-2**: 数据隔离查询必须在数据库层面过滤，不能依赖前端
- **NFR-3**: 官方智能体加载性能：首屏加载 < 2s
- **NFR-4**: 权限校验不增加显著的接口延迟（< 50ms）
- **NFR-5**: 向后兼容，已有用户数据不受影响

## Constraints
- **Technical**: 
  - 基于 LobeHub 现有技术栈（Next.js + React + TypeScript + Drizzle ORM + PostgreSQL）
  - 复用现有 RBAC 系统，不重新造轮子
  - 复用现有 agent_shares 表结构扩展官方商店
- **Business**: 
  - 第一阶段聚焦权限管控和官方商店，支付和订阅后续阶段再做
  - 优先保证核心功能可用，管理后台 UI 可延后
- **Dependencies**: 
  - 依赖现有 RBAC 模型和 agent_shares 表
  - 依赖现有 user 认证体系

## Assumptions
- 超级管理员账号通过数据库手动初始化或环境变量配置
- 官方智能体由管理员在个人空间创建后再发布
- 用户安装官方智能体是浅复制（复制配置，不复制聊天记录）
- 工作区功能保留但本期不作为重点，后续作为团队版功能

## Acceptance Criteria

### AC-1: 新用户默认免费角色
- **Given**: 用户通过邮箱或第三方登录注册新账号
- **When**: 注册完成，用户首次登录
- **Then**: 用户自动获得 free_user 角色，无智能体创建权限
- **Verification**: `programmatic`
- **Notes**: 检查数据库 rbac_user_roles 表是否正确关联

### AC-2: 免费用户前端无创建入口
- **Given**: free_user 角色用户登录系统
- **When**: 用户浏览个人空间
- **Then**: 「创建智能体」按钮、智能体设置中的新建入口均不可见
- **Verification**: `human-judgment`
- **Notes**: 检查所有可能的创建入口是否都已隐藏

### AC-3: 免费用户后端无法创建智能体
- **Given**: free_user 角色用户已登录
- **When**: 用户通过 API 直接调用创建智能体接口
- **Then**: 接口返回 403 Forbidden，提示无权限
- **Verification**: `programmatic`
- **Notes**: 必须通过后端校验，不能只依赖前端隐藏

### AC-4: 管理员可发布官方智能体
- **Given**: super_admin 角色用户拥有一个私有智能体
- **When**: 管理员将该智能体发布为官方智能体
- **Then**: 该智能体出现在官方智能体商店中，所有用户可见
- **Verification**: `programmatic`
- **Notes**: 通过修改 agent_shares 表的 share_scope 字段实现

### AC-5: 官方智能体商店可见
- **Given**: 任意角色用户登录系统
- **When**: 用户访问「发现」页
- **Then**: 展示官方智能体列表，支持搜索和分类筛选
- **Verification**: `human-judgment`

### AC-6: 用户可安装官方智能体
- **Given**: 用户在官方智能体商店浏览
- **When**: 用户点击「使用」或「安装」某个官方智能体
- **Then**: 该智能体被复制到用户个人空间，用户可开始聊天使用
- **Verification**: `programmatic`
- **Notes**: 复制后的智能体与原官方智能体独立，用户可自定义配置

### AC-7: 用户数据隔离
- **Given**: 用户 A 和用户 B 都是 free_user
- **When**: 用户 A 安装了官方智能体并产生聊天记录
- **Then**: 用户 B 看不到用户 A 的智能体和聊天记录
- **Verification**: `programmatic`

### AC-8: VIP 用户可创建智能体（预留）
- **Given**: vip_user 角色用户登录系统
- **When**: 用户尝试创建智能体
- **Then**: 可以正常创建，前端展示创建入口
- **Verification**: `programmatic`
- **Notes**: 本期实现权限逻辑，VIP 用户通过数据库手动分配角色测试

## Open Questions
- [ ] 官方智能体商店的 UI 形态：沿用现有发现页还是重新设计？
- [ ] 智能体安装是「复制一份」还是「引用使用」？各自的优劣？
- [ ] 超级管理员初始账号如何创建？环境变量配置 vs 首次登录指定 vs 数据库脚本？
- [ ] 工作区功能在本期是完全禁用还是保留但不推荐？
