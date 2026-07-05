# Tasks

- [x] Task 1: 修复发现按钮不可见问题
  - [x] 在 `src/store/global/selectors/systemStatus.ts` 的 `DEFAULT_SIDEBAR_ITEMS` 中添加 `discover`
  - [x] 在 `src/hooks/useNavLayout.ts` 中确认发现按钮的 `key` 为 `discover`
  - [x] 验证导航栏中出现发现按钮

- [x] Task 2: 发现页增加分类 Tab（专家 / 专家团）
  - [x] 修改发现页，在页面顶部增加 Tabs 组件
  - [x] 「专家」Tab 复用现有 AgentList 组件
  - [x] 新建 AgentGroupList 组件
  - [x] 添加 i18n key

- [x] Task 3: 后端 - 智能体群组发布/取消发布接口
  - [x] 新增 RBAC 权限 GROUP_PUBLISH
  - [x] 新建 chatGroupShares 表和 ChatGroupShareModel
  - [x] 新增发布/取消发布/查询/安装接口

- [x] Task 4: 前端 - 智能体群组发布按钮
  - [x] 新建 officialGroup service
  - [x] 修改群组 Header 增加发布按钮
  - [x] 新增 publish_group 权限映射
  - [x] 添加 i18n key

- [x] Task 5: 发现页智能体群组列表和详情
  - [x] 实现 AgentGroupList 组件
  - [x] 新建群组详情页
  - [x] 注册路由

- [x] Task 6: 导航可见性配置（管理员设置页）
  - [x] 新增导航可见性 feature flags
  - [x] 新建 NavVisibility 配置组件
  - [x] 修改 useNavLayout 读取可见性配置
  - [x] 后端新增 updateNavVisibility mutation
  - [x] 添加 i18n key

- [x] Task 7: 集成验证
  - [x] 类型检查通过（`bun run type-check`）

# Task Dependencies
- Task 2 依赖 Task 3
- Task 4 依赖 Task 3
- Task 5 依赖 Task 3
- Task 6 独立，可并行开发
- Task 1 独立，优先级最高
