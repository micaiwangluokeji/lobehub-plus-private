# Tasks: LobeHub + NocoBase 管理后台集成

## 任务概览

采用**方案二：NocoBase 独立数据库 + LobeHub API**，实现 LobeHub 与 NocoBase 的深度集成。

---

## Phase 1: 技术验证（1 周）

- [ ] 1.1: 验证 NocoBase 作为 OIDC Provider 的能力
  - 部署 NocoBase 测试环境
  - 启用 `@nocobase/plugin-idp-oauth` 插件
  - 配置 OIDC Provider
  - 测试 OIDC 认证流程

- [ ] 1.2: 验证 LobeHub Generic OIDC 对接能力
  - 配置 LobeHub Generic OIDC Provider
  - 测试 SSO 登录流程
  - 验证用户信息同步

- [ ] 1.3: 验证数据库共享方案
  - 配置 NocoBase 连接 LobeHub 数据库
  - 测试跨系统用户数据访问
  - 验证数据一致性

---

## Phase 2: NocoBase 用户管理系统（1 周）

- [ ] 2.1: 配置 NocoBase 数据库连接
  - 连接 LobeHub PostgreSQL 数据库
  - 配置只读用户权限
  - 测试连接稳定性

- [ ] 2.2: 创建 NocoBase 用户管理 Collections
  - 用户表（users）视图配置
  - 用户搜索和筛选
  - 用户编辑表单
  - 用户创建/禁用/删除

- [ ] 2.3: 配置 NocoBase RBAC 权限
  - 创建管理员角色
  - 配置用户管理权限
  - 配置敏感字段只读
  - 测试权限控制

- [ ] 2.4: 创建部门/分组管理（如需要）
  - 部门 Collection
  - 用户-部门关联
  - 组织架构树视图

---

## Phase 3: 订阅与套餐系统（2 周）

- [ ] 3.1: 设计订阅相关数据表
  - 套餐表（plans）
  - 订单表（orders）
  - 支付记录表（payments）
  - 积分表（credits）
  - 积分流水表（credit_transactions）
  - 订阅表（subscriptions）

- [ ] 3.2: 开发套餐管理 NocoBase 插件
  - 套餐 CRUD
  - 套餐功能配置
  - 价格配置
  - 套餐上下架

- [ ] 3.3: 开发订单管理 NocoBase 插件
  - 订单列表
  - 订单详情
  - 订单状态管理
  - 退款处理

- [ ] 3.4: 开发积分管理 NocoBase 插件
  - 积分余额管理
  - 积分充值
  - 积分消耗记录
  - 积分规则配置

---

## Phase 4: 支付系统集成（2 周）

- [ ] 4.1: 开发微信支付 NocoBase 插件
  - 微信支付 API 封装
  - 统一下单接口
  - 支付回调处理
  - 退款接口

- [ ] 4.2: 实现支付流程
  - 扫码支付（H5/PC）
  - 支付结果查询
  - 支付成功通知
  - 支付失败处理

- [ ] 4.3: 集成订单和积分
  - 支付成功后自动创建订单
  - 积分自动充值
  - 订单状态同步

---

## Phase 5: LobeHub API 层开发（1 周）

- [ ] 5.1: 开发管理员 API
  - 用户管理 API
  - 订阅查询 API
  - 积分查询 API
  - 统计 API

- [ ] 5.2: 开发权限中间件
  - super_admin 验证
  - 操作审计日志
  - 敏感操作确认

- [ ] 5.3: 订阅校验中间件
  - 检查用户套餐状态
  - 检查积分余额
  - 功能限制校验

---

## Phase 6: 前端集成（1 周）

- [ ] 6.1: LobeHub 订阅页面 iframe 嵌入
  - NocoBase iframe 包装器
  - 认证状态同步
  - 主题样式适配

- [ ] 6.2: NocoBase 管理后台 iframe 嵌入
  - 嵌入到 LobeHub 管理菜单
  - 权限控制（仅管理员可见）

- [ ] 6.3: 通知系统集成
  - 订阅到期提醒
  - 积分不足提醒
  - 订单状态通知

---

## Phase 7: 测试与部署（1 周）

- [ ] 7.1: 功能测试
  - 用户管理功能测试
  - 订阅管理功能测试
  - 支付流程测试
  - 积分系统测试

- [ ] 7.2: 安全测试
  - 权限绕过测试
  - SQL 注入测试
  - XSS 测试

- [ ] 7.3: 性能测试
  - 大数据量测试
  - 并发测试
  - 压力测试

- [ ] 7.4: 部署文档
  - 环境配置
  - 部署步骤
  - 故障排查

---

## 任务依赖关系

```
Phase 1 (技术验证)
    ↓
Phase 2 (用户管理) ←──┐
    ↓                │
Phase 3 (订阅系统) ←─┤
    ↓                │
Phase 4 (支付系统) ←─┤
    ↓                │
Phase 5 (API 层)   ←─┤
    ↓                │
Phase 6 (前端集成) ←─┘
    ↓
Phase 7 (测试部署)
```

---

## 验收标准

1. NocoBase 能够管理 LobeHub 用户数据
2. 用户可以通过 NocoBase SSO 登录 LobeHub
3. 套餐和订阅可以在 NocoBase 中管理
4. 微信支付能够正常完成
5. LobeHub 前端能够 iframe 嵌入 NocoBase 管理页面
6. 所有功能测试通过
7. 安全测试通过
