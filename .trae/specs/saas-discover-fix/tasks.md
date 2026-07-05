# Tasks

- [x] Task 1: 修复发现按钮不可见问题
  - [x] 修改 `src/hooks/useNavLayout.ts` 中发现按钮的 `hidden` 条件：移除对 `showMarket` 的依赖，改为 `hidden: !isNavVisibleForRole('discover')`
  - [x] 确认 `DEFAULT_SIDEBAR_ITEMS` 中包含 `discover`
  - [x] 确认 `SidebarTabKey.Discover` 枚举值存在
  - [x] 确认路由配置中 `discover` 路由已注册

- [x] Task 2: 重启开发服务器并验证配置
  - [x] 停止当前开发服务器
  - [x] 重新启动开发服务器（`bun run dev`）
  - [x] 确认 `/discover/agent` 不再被重定向

- [x] Task 3: 端到端功能验证
  - [x] 访问 `/discover/agent` 页面确认两个 Tab（专家/专家团）正常显示
  - [x] 确认发现按钮在导航栏首页和任务按钮之间可见
  - [x] 访问 `/settings/appearance` 确认导航可见性配置组件可见
  - [x] 确认群组编辑页 Header 的发布按钮正常显示（管理员）
  - [x] 类型检查通过（`bun run type-check`）

# Task Dependencies
- Task 1 为最高优先级，是其他任务的前提
- Task 2 依赖 Task 1 完成
- Task 3 依赖 Task 2 完成
