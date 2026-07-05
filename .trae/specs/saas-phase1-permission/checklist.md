# SaaS 改造阶段一：权限管控与官方智能体商店 - Verification Checklist

## 数据层验证
- [x] 数据库中存在 super_admin、vip_user、free_user 三个全局角色
- [x] 各角色权限关联正确：super_admin 有所有权限，vip_user 有 agent:create，free_user 没有
- [x] 管理员用户（903164524@qq.com）正确关联 super_admin 角色
- [x] agent_shares 表支持 official 范围标识（visibility 字段扩展 'official' 值）

## 用户注册流程验证
- [ ] 新注册邮箱用户自动获得 free_user 角色
- [ ] 新注册第三方登录用户自动获得 free_user 角色
- [ ] 已有用户的角色不受影响
- [ ] 角色分配是幂等的，重复注册不会重复添加

## 后端权限验证
- [ ] free_user 调用 agent.create 接口返回 403 Forbidden
- [ ] super_admin 调用 agent.create 接口返回 200 成功
- [ ] vip_user 调用 agent.create 接口返回 200 成功
- [ ] free_user 调用 agent.update 接口只能更新自己的智能体
- [ ] free_user 调用 agent.delete 接口只能删除自己的智能体
- [ ] 用户不能查询到其他用户的智能体
- [x] 权限校验有统一的中间件/工具函数，不散落各处

## 前端权限验证
- [ ] free_user 登录后侧边栏看不到「新建智能体」按钮
- [ ] free_user 登录后智能体列表页没有创建按钮
- [ ] free_user 访问创建智能体的 URL 会被重定向或提示无权限
- [ ] super_admin 能看到所有创建入口
- [ ] vip_user 能看到所有创建入口
- [x] useUserPermissions / useUserRole hook 能正确获取当前用户角色和权限
- [x] 权限状态有缓存，不会每次都请求

## 官方智能体发布验证
- [ ] super_admin 可以将自有智能体发布为官方智能体
- [ ] super_admin 可以下架官方智能体
- [ ] free_user 无法发布官方智能体（接口返回 403）
- [ ] 官方智能体列表接口可正常访问（登录/未登录都能看列表）
- [ ] 官方智能体详情接口可正常访问

## 官方智能体安装验证
- [ ] 用户点击「使用」可成功安装官方智能体
- [ ] 安装后的智能体出现在用户个人空间的智能体列表中
- [ ] 安装后的智能体配置与官方智能体一致（system prompt、模型设置等）
- [ ] 安装后的智能体有独立的 agent_id，与官方智能体数据隔离
- [ ] 用户修改安装后的智能体不会影响官方智能体
- [ ] 聊天记录只属于当前用户，其他用户看不到
- [ ] 重复安装有适当处理（提示已安装或创建新副本）

## 发现页 UI 验证
- [ ] 发现页展示官方智能体列表
- [ ] 智能体卡片展示头像、名称、描述、分类/标签
- [ ] 支持搜索功能（按名称/描述搜索）
- [ ] 支持分类筛选
- [ ] 点击智能体卡片可查看详情
- [ ] 详情页有「使用」/「安装」按钮
- [ ] 安装过程有 loading 状态和成功/失败提示
- [ ] 安装成功后自动跳转到聊天页或智能体列表

## 数据隔离验证
- [ ] 用户 A 的智能体列表只包含自己创建和安装的
- [ ] 用户 B 看不到用户 A 的智能体
- [ ] 用户 A 的聊天记录用户 B 看不到
- [ ] 官方智能体源数据只有管理员可编辑
- [ ] workspace 数据按 workspace_id 隔离

## 角色展示验证
- [x] 个人设置中展示当前用户角色（RoleRow 组件，useUserRoles hook）
- [x] 免费用户显示「免费用户」标识（Tag color=default）
- [x] VIP 用户显示「VIP」标识（Tag color=purple）
- [x] 管理员显示「管理员」标识（Tag color=gold）
- [x] 免费用户有「升级 VIP」入口（占位按钮，跳转 /settings/billing）

## 回归测试
- [ ] 已有的聊天功能正常
- [ ] 已有的智能体编辑功能正常（有权限的用户）
- [ ] 工作区功能不受影响
- [ ] 登录/登出流程正常
- [ ] 个人设置页面正常
- [x] 类型检查通过（bun run type-check exit 0）
- [x] 开发服务器能正常启动，无运行时错误（Next.js Ready + Vite ready + GET /signin 200）
- [x] RBAC 模型单元测试通过（27/27 tests passed）

## 性能与安全
- [ ] 权限校验不增加显著接口延迟（< 50ms）
- [ ] 官方智能体列表加载 < 2s
- [x] 后端权限校验是强制的，不能通过前端绕过（withScopedPermission + withRbacPermission 中间件）
- [x] 没有 SQL 注入风险（使用 Drizzle 参数化查询）
- [x] 敏感操作有身份认证，未登录用户不能访问（authedProcedure 基础中间件）
