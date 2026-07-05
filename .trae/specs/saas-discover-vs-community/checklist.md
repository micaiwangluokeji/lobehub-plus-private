# 发现页与社区页分离 - Verification Checklist

## RBAC 权限扩展
- [ ] `AGENT_PUBLISH` action 已添加到 `PERMISSION_ACTIONS`
- [ ] vip_user 角色拥有 `agent:publish:owner` 权限
- [ ] free_user 角色没有任何 `agent:publish` 权限
- [ ] super_admin 拥有 `agent:publish:all` 权限

## 后端发布权限
- [ ] `publishAsOfficialAgent` 支持 `agent:update:all`（管理员全量）和 `agent:publish:owner`（VIP 自有）两种权限路径
- [ ] `unpublishOfficialAgent` 同样支持两种权限路径
- [ ] VIP 用户尝试发布别人的智能体返回 403
- [ ] 免费用户调用发布接口返回 403
- [ ] 重复发布/下架操作幂等，不报错

## 社区页
- [ ] `/community/agent` 数据源为 LobeHub 官方 Market API（非本地）
- [ ] 社区页有访问权限保护，非管理员访问被重定向
- [ ] 社区页其他 tab（MCP/模型/插件等）保持正常工作
- [ ] 左侧导航「社区」按钮仅管理员可见

## 发现页
- [ ] `/discover/agent` 路由存在且可访问
- [ ] 发现页展示本地 `visibility='official'` 的智能体
- [ ] 发现页支持搜索和分页
- [ ] 发现页支持安装智能体（幂等）
- [ ] 左侧导航「发现」按钮对所有登录用户可见

## 发现页详情页
- [ ] `/discover/agent/[agentId]` 路由存在且可访问
- [ ] 详情页展示智能体完整信息（介绍、系统提示词、能力等）
- [ ] 详情页沿用社区详情页的 UI 布局模式
- [ ] 详情页「使用」按钮安装成功并跳转聊天
- [ ] 数据源为本地 official agent，非 Market API

## 移动端适配
- [ ] 发现页列表移动端布局正常
- [ ] 发现页详情页移动端布局正常
- [ ] 社区页移动端非管理员访问被重定向
- [ ] 移动端导航入口权限规则与桌面端一致

## 导航入口
- [ ] free_user 登录：只看到「发现」，看不到「社区」
- [ ] vip_user 登录：只看到「发现」，看不到「社区」
- [ ] super_admin 登录：同时看到「发现」和「社区」

## 前端发布入口
- [ ] super_admin 在任意智能体编辑页看到发布菜单项
- [ ] vip_user 在自己的智能体编辑页看到发布菜单项
- [ ] free_user 看不到发布菜单项
- [ ] 菜单项文案为「发布到发现页」/「从发现页下架」

## i18n
- [ ] 发现页相关文案有 en-US 和 zh-CN 双语
- [ ] 发布相关文案与"发现页"一致

## 整体验证
- [ ] 类型检查通过（bun run type-check）
- [ ] 开发服务器正常启动
- [ ] 完整流程：管理员发布 → 普通用户发现页浏览 → 安装使用
- [ ] VIP 完整流程：VIP 创建智能体 → VIP 发布到发现页 → 其他用户在发现页看到并安装
- [ ] 数据隔离：不同用户安装的智能体互不干扰
