# Tasks

- [x] Task 1: 修复前端权限 action
  - [x] 修改 `src/routes/(main)/group/profile/features/Header/index.tsx`：`usePermission('publish_agent')` → `usePermission('publish_group')`

- [x] Task 2: 验证数据库权限配置
  - [x] 检查 `rbac_permissions` 表是否存在 `group:publish:all` 和 `group:publish:owner` 权限记录
  - [x] 检查 `super_admin` 角色是否关联 `group:publish:all` 权限（166 permissions）
  - [x] 检查 `vip_user` 角色是否关联 `group:publish:owner` 权限（48 permissions）

- [x] Task 3: 运行权限同步脚本（如 Task 2 发现缺失）
  - [x] 执行 `bun run tsx scripts/init-system-roles.ts` 同步权限定义
  - [x] 验证同步后的数据库状态

- [x] Task 4: 添加诊断日志和改进错误处理
  - [x] 在 `agentGroup.ts` publishAsOfficialGroup 路由中添加详细日志
  - [x] 在 `chatGroupShare.ts` publishAsOfficial 方法中添加日志
  - [x] 改进前端错误处理，显示 trpc 错误具体信息

- [ ] Task 5: 端到端功能验证（需用户手动测试）
  - [ ] 重启开发服务器使代码更改生效
  - [ ] 打开浏览器开发者工具（F12）查看控制台日志
  - [ ] 登录管理员账户（903164524@qq.com）
  - [ ] 访问群组配置页面，点击发布按钮
  - [ ] 查看浏览器控制台和终端日志，确认失败原因
  - [ ] 根据日志定位并修复根本问题

# Task Dependencies

- Task 1 已完成（前端修复）
- Task 2 依赖 Task 1（前端修复后才能验证完整链路）
- Task 3 依赖 Task 2（仅在发现权限缺失时执行）
- Task 4 依赖 Task 2 或 Task 3 完成