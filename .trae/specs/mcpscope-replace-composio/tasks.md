# 魔搭 MCP 替代 Composio - 实现计划

## [ ] Task 1: 创建魔搭 MCP 服务常量定义

- **Priority**: high
- **Depends On**: None
- **Description**:
  - 在 `packages/const/src/` 目录下创建 `mcpscope.ts` 文件
  - 定义 10 个中国本土服务的 MCP 配置常量，包括飞书、钉钉、企业微信、微信公众号、小红书、支付宝、阿里云盘、百度搜索、微博、知乎
  - 每个服务包含：identifier、label、icon、description、mcpUrl（魔搭 Hosted 服务 URL）、envVars（需要的环境变量）
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3
- **Test Requirements**:
  - `human-judgment` TR-1.1: 检查常量定义文件是否存在，包含所有 10 个服务
  - `human-judgment` TR-1.2: 检查每个服务的配置是否完整（identifier、label、icon、description）
- **Notes**: 需要确认魔搭 MCP 广场上各服务的具体 SSE URL

## [ ] Task 2: 创建魔搭 MCP Store 切片

- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - 在 `src/store/tool/slices/` 目录下创建 `mcpscopeStore` 目录
  - 创建 `initialState.ts`、`types.ts`、`action.ts` 文件
  - 实现魔搭 MCP 服务的状态管理：连接、断开、刷新状态、获取工具列表
  - 实现 `createMcpscopeConnection`、`refreshMcpscopeConnectionStatus`、`removeMcpscopeConnection` 等方法
- **Acceptance Criteria Addressed**: AC-3, AC-4
- **Test Requirements**:
  - `human-judgment` TR-2.1: 检查 Store 文件是否完整创建
  - `human-judgment` TR-2.2: 检查状态管理逻辑是否完整（连接、断开、刷新）
- **Notes**: 参考 composioStore 的实现结构

## [ ] Task 3: 创建魔搭 MCP 服务组件

- **Priority**: high
- **Depends On**: Task 1, Task 2
- **Description**:
  - 在 `src/routes/(main)/settings/skill/features/` 目录下创建 `McpscopeSkillItem.tsx`
  - 实现魔搭 MCP 服务项的展示组件，包含连接按钮、状态显示、断开按钮
  - 参考 `ComposioSkillItem.tsx` 的实现风格
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4, AC-5
- **Test Requirements**:
  - `human-judgment` TR-3.1: 检查组件是否正确显示服务名称、图标、状态
  - `human-judgment` TR-3.2: 检查连接/断开按钮是否正常工作
  - `human-judgment` TR-3.3: 检查权限控制是否正确（无权限时按钮禁用）
- **Notes**: 需要实现 API Key 输入对话框

## [ ] Task 4: 更新 SkillList 组件，替换 Composio 为魔搭 MCP

- **Priority**: high
- **Depends On**: Task 1, Task 2, Task 3
- **Description**:
  - 修改 `src/routes/(main)/settings/skill/features/SkillList.tsx`
  - 将 `COMPOSIO_APP_TYPES` 替换为魔搭 MCP 服务列表
  - 将 `ComposioSkillItem` 替换为 `McpscopeSkillItem`
  - 更新分类逻辑，将 Composio 分类替换为魔搭 MCP 分类
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `human-judgment` TR-4.1: 检查 `/settings/skill` 页面是否显示魔搭 MCP 服务
  - `human-judgment` TR-4.2: 检查技能商店弹窗是否显示魔搭 MCP 服务
- **Notes**: 需要同步更新两处的 SkillList 使用

## [ ] Task 5: 更新技能商店内容组件

- **Priority**: high
- **Depends On**: Task 1, Task 2, Task 3
- **Description**:
  - 修改 `src/features/SkillStore/SkillStoreContent.tsx`
  - 更新 LobeHub tab 的展示逻辑，替换 Composio 工具为魔搭 MCP 服务
  - 更新搜索和分类逻辑
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `human-judgment` TR-5.1: 检查技能商店弹窗 LobeHub tab 是否显示魔搭 MCP 服务
  - `human-judgment` TR-5.2: 检查搜索功能是否正常工作
- **Notes**: 需要确保与 settings/skill 页面保持一致

## [ ] Task 6: 创建魔搭 MCP 后端路由

- **Priority**: medium
- **Depends On**: Task 1
- **Description**:
  - 在 `apps/server/src/routers/lambda/` 目录下创建 `mcpscope.ts`
  - 实现魔搭 MCP 服务的连接管理：创建连接、获取连接状态、删除连接
  - 调用魔搭 OpenAPI 获取 MCP 服务的 SSE URL
- **Acceptance Criteria Addressed**: AC-3, AC-4
- **Test Requirements**:
  - `programmatic` TR-6.1: POST `/api/lambda/mcpscope/createConnection` 返回 200 状态码和 SSE URL
  - `programmatic` TR-6.2: GET `/api/lambda/mcpscope/getConnection` 返回连接状态
  - `human-judgment` TR-6.3: 检查路由文件是否完整
- **Notes**: 需要了解魔搭 OpenAPI 的具体接口

## [ ] Task 7: 更新权限配置（如需要）

- **Priority**: low
- **Depends On**: Task 3
- **Description**:
  - 检查是否需要添加新的权限码用于魔搭 MCP 服务连接
  - 如果需要，在 `packages/const/src/rbac.ts` 中添加权限码
  - 在 `src/hooks/usePermission.ts` 中添加权限映射
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `human-judgment` TR-7.1: 检查权限系统是否正常工作
  - `human-judgment` TR-7.2: 无权限用户无法连接服务
- **Notes**: 优先复用现有权限码

## [ ] Task 8: 添加国际化翻译

- **Priority**: medium
- **Depends On**: Task 1, Task 3
- **Description**:
  - 在 `src/locales/default/admin.ts` 中添加魔搭 MCP 服务的翻译键
  - 在 `src/locales/zh-CN/admin.ts` 中添加中文翻译
  - 在 `src/locales/en-US/admin.ts` 中添加英文翻译
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `human-judgment` TR-8.1: 检查中英文翻译是否完整
  - `human-judgment` TR-8.2: 检查页面显示是否正确
- **Notes**: 需要添加每个服务的名称、描述等翻译

## [ ] Task 9: 测试和验证

- **Priority**: high
- **Depends On**: All
- **Description**:
  - 启动开发服务器测试功能
  - 验证所有页面显示正常
  - 验证连接流程正常
  - 验证权限控制正常
- **Acceptance Criteria Addressed**: All
- **Test Requirements**:
  - `human-judgment` TR-9.1: `/settings/skill` 页面显示魔搭 MCP 服务
  - `human-judgment` TR-9.2: 技能商店弹窗显示魔搭 MCP 服务
  - `human-judgment` TR-9.3: 连接和断开功能正常
  - `human-judgment` TR-9.4: 权限控制正常
- **Notes**: 需要实际测试连接功能
