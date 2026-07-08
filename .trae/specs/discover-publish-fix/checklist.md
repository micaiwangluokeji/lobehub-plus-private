# 发现页与发布功能修复 - 验证清单

## 导航可见性

- [ ] Checkpoint 1: 侧边栏中可以看到"发现"导航入口，点击后跳转到 `/discover/agent`
- [ ] Checkpoint 2: 发现页导航入口的 icon 正确显示（ShapesIcon）
- [ ] Checkpoint 3: 不同角色（super_admin/pro_user/free_user）看到的导航可见性符合 feature flag 配置

## Agent 发布功能

- [ ] Checkpoint 4: Agent Profile 页面（`/agent/agt_xxx/profile`）Header 下拉菜单中有"发布到发现页"选项（super_admin 用户）
- [ ] Checkpoint 5: 点击"发布到发现页"后弹出确认框
- [ ] Checkpoint 6: 确认发布后，Agent 出现在发现页列表中
- [ ] Checkpoint 7: 已发布的 Agent 显示"取消发布"选项
- [ ] Checkpoint 8: 取消发布后，Agent 从发现页列表中消失
- [ ] Checkpoint 9: 发布操作后 AgentStatusTag 状态正确更新

## Group 发布功能

- [ ] Checkpoint 10: Group Profile 页面（`/group/cg_xxx/profile`）中有"发布到发现页"按钮（super_admin 用户）
- [ ] Checkpoint 11: 点击"发布到发现页"后弹出确认框
- [ ] Checkpoint 12: 确认发布后，Group 出现在发现页列表中
- [ ] Checkpoint 13: 已发布的 Group 显示"取消发布"选项
- [ ] Checkpoint 14: 取消发布后，Group 从发现页列表中消失

## 权限控制

- [ ] Checkpoint 15: `903164524@qq.com` 用户的 TRPC `user.getUserPermissions` 接口返回 `agent:publish:all` 和 `group:publish:all`
- [ ] Checkpoint 16: `903164524@qq.com` 用户的 TRPC `user.getUserRoles` 接口返回 `super_admin` 角色
- [ ] Checkpoint 17: free_user 用户看不到发布按钮（或看到 ProGate 升级提示）
- [ ] Checkpoint 18: pro_user 用户可以看到"发布到发现页"按钮（仅限自己创建的 Agent/Group）

## 数据库完整性

- [ ] Checkpoint 19: `rbac_permissions` 表中存在 `agent:publish:all` 和 `group:publish:all` 权限记录
- [ ] Checkpoint 20: `super_admin` 角色在 `rbac_role_permissions` 中包含上述权限
