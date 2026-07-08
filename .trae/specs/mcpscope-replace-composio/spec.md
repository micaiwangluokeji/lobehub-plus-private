# 魔搭 MCP 替代 Composio - 产品需求文档

## Overview

- **Summary**: 将 LobeHub 中的 Composio 连接器替换为魔搭 (ModelScope) MCP 广场服务，集成约 10 个常用的中国本土服务，包括飞书、微信公众号、小红书、钉钉、企业微信等。
- **Purpose**: 解决 Composio 不支持中国本土服务的问题，为中国用户提供本地化的工具连接器能力。
- **Target Users**: 中国企业用户和个人用户，需要使用飞书、钉钉、微信等中国本土服务的 AI 智能体。

## Goals

- 将 `/settings/skill` 页面中的 Composio 连接器替换为魔搭 MCP 服务
- 将技能商店弹窗（LobeHub tab）中的 Composio 工具替换为魔搭 MCP 服务
- 集成 10 个常用的中国本土服务作为默认 MCP 连接器
- 保持与现有连接流程和权限系统的兼容性

## Non-Goals (Out of Scope)

- 不修改后端 Composio 路由（保留作为向后兼容）
- 不实现 OAuth 认证的完整流程（使用 MCP 标准认证）
- 不添加新的权限码（复用现有权限系统）
- 不修改 MCP Client 核心逻辑

## Background & Context

- 当前系统使用 Composio 作为工具连接器平台，但 Composio 不支持任何中国本土服务
- 魔搭 (ModelScope) MCP 广场是阿里巴巴旗下的 MCP 服务平台，支持标准 MCP 协议，提供千余款 MCP 服务，包括支付宝、MiniMax 等独家首发服务
- LobeHub 已有完整的 MCP 支持体系，可以通过 HTTP MCP 方式接入任意 MCP Server

## 拟集成的 10 个中国本土服务

| #   | 服务名称   | 类型     | 描述                         |
| --- | ---------- | -------- | ---------------------------- |
| 1   | 飞书       | 企业协作 | 消息发送、用户管理、文档操作 |
| 2   | 钉钉       | 企业协作 | 消息发送、审批管理、日程安排 |
| 3   | 企业微信   | 企业协作 | 消息发送、客户管理、通讯录   |
| 4   | 微信公众号 | 社交媒体 | 图文消息、粉丝管理、菜单管理 |
| 5   | 小红书     | 社交电商 | 笔记发布、搜索、评论管理     |
| 6   | 支付宝     | 支付     | 转账、订单查询、账单管理     |
| 7   | 阿里云盘   | 云存储   | 文件上传、下载、分享         |
| 8   | 百度搜索   | 搜索     | 网页搜索、新闻搜索           |
| 9   | 微博       | 社交媒体 | 微博发布、评论、粉丝管理     |
| 10  | 知乎       | 问答平台 | 提问、回答、文章发布         |

## Functional Requirements

- **FR-1**: 在 `/settings/skill` 页面中，将 Composio 连接器替换为魔搭 MCP 服务列表
- **FR-2**: 在技能商店弹窗（LobeHub tab）中，将 Composio 工具替换为魔搭 MCP 服务
- **FR-3**: 集成 10 个中国本土服务作为默认 MCP 连接器，在技能商店中展示
- **FR-4**: 用户可以点击 Connect 按钮连接魔搭 MCP 服务，获取专属 SSE URL
- **FR-5**: 已连接的服务在列表中显示为活跃状态，可进行断开连接操作
- **FR-6**: 保持与现有权限系统的兼容性，用户需要 `create_content` 和 `edit_own_content` 权限才能连接

## Non-Functional Requirements

- **NFR-1**: 页面加载时间不超过 2 秒
- **NFR-2**: 连接流程响应时间不超过 3 秒
- **NFR-3**: 支持 HTTPS 连接到魔搭 MCP 服务
- **NFR-4**: 错误处理友好，连接失败时有明确的错误提示

## Constraints

- **Technical**: 必须使用标准 MCP 协议，与 LobeHub 现有 MCP 系统兼容
- **Business**: 魔搭 MCP 服务可能需要 API Key，用户需要自行申请
- **Dependencies**: 依赖魔搭 MCP 广场的 Hosted 服务可用

## Assumptions

- 魔搭 MCP 广场提供稳定的 Hosted 服务
- 用户已注册魔搭账号并获取必要的 API Key
- 魔搭 MCP 服务的 SSE URL 格式与 LobeHub MCP Client 兼容

## Acceptance Criteria

### AC-1: 设置页面显示魔搭 MCP 服务

- **Given**: 用户访问 `/settings/skill` 页面
- **When**: 页面加载完成
- **Then**: 显示魔搭 MCP 服务列表，包含飞书、钉钉、企业微信等中国本土服务
- **Verification**: `human-judgment`

### AC-2: 技能商店弹窗显示魔搭 MCP 服务

- **Given**: 用户在聊天页面点击 + 号打开技能商店
- **When**: 切换到 LobeHub tab
- **Then**: 显示魔搭 MCP 服务，替换原来的 Composio 工具
- **Verification**: `human-judgment`

### AC-3: 用户可以连接魔搭 MCP 服务

- **Given**: 用户有连接权限
- **When**: 点击某个服务的 Connect 按钮
- **Then**: 弹出配置对话框，输入 API Key 后获取 SSE URL，服务状态变为活跃
- **Verification**: `human-judgment`

### AC-4: 用户可以断开魔搭 MCP 服务

- **Given**: 用户已连接某个魔搭 MCP 服务
- **When**: 点击断开连接按钮
- **Then**: 服务状态变为断开，连接信息被清除
- **Verification**: `human-judgment`

### AC-5: 权限控制正常

- **Given**: 用户没有 `create_content` 或 `edit_own_content` 权限
- **When**: 访问技能商店或设置页面
- **Then**: Connect 按钮被禁用，显示权限不足提示
- **Verification**: `human-judgment`

## Open Questions

- [ ] 魔搭 MCP 服务的具体 SSE URL 格式是什么？是否需要 OAuth 认证？
- [ ] 部分服务（如飞书、钉钉）是否需要用户自行创建 OAuth 应用？
- [ ] 是否需要提供魔搭账号注册和 API Key 获取的引导文档？
