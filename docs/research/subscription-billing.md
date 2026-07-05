# LobeHub 订阅与计费系统调研

## 一、系统现状

### 1.1 开源版 vs 商业版

LobeHub 采用开源 + 商业 SaaS 的双轨模式：

| 特性 | 开源版 | 商业版（云端） |
|------|--------|---------------|
| 前端订阅页面 | ❌ 无（仅 iframe 占位） | ✅ 完整实现 |
| 套餐管理 | ❌ 无 | ✅ 完整实现 |
| 积分系统 | ❌ 无 | ✅ 完整实现 |
| 计费系统 | ❌ 无 | ✅ 完整实现 |
| 支付接入 | ❌ 无 | ✅ Stripe 等 |
| 推荐系统 | ❌ 无 | ✅ 完整实现 |
| 用量统计 | ❌ 无 | ✅ 完整实现 |

### 1.2 前端实现方式

开源版的订阅相关页面使用 **iframe 嵌入** 官方网站的方式实现：

```
src/business/client/BusinessSettingPages/
├── Plans.tsx              # 套餐页 → iframe /embed/subscription/plans
├── Billing.tsx            # 账单页 → iframe /embed/subscription/billing
├── Credits.tsx            # 积分页 → iframe /embed/subscription/credits
├── Usage.tsx              # 用量页 → iframe /embed/subscription/usage
├── Referral.tsx           # 推荐页 → iframe /embed/subscription/referral
├── Notification.tsx       # 通知页 → iframe /embed/settings/notification
├── WorkspaceBilling*.tsx  # 工作区计费相关
└── SubscriptionIframeWrapper.tsx  # iframe 包装器
```

**关键点**：
- 仅在桌面端（Electron）且云模式激活时显示
- 使用 `webview` 标签（Electron）嵌入官方页面
- 通过 `partition` 隔离 cookie 存储
- 链接点击会在外部浏览器打开

### 1.3 服务端实现现状

开源版商业版服务端路由大多为**空实现（stub）**：

```
packages/business-server/src/lambda-routers/
├── subscription.ts        # ❌ 空：router({})
├── workspaceCredits.ts    # ❌ 空：router({})
├── workspaceUsage.ts      # ❌ 空：router({})
├── spend.ts               # ❌ 空：router({})
├── topUp.ts               # ❌ 空：router({})
├── referral.ts            # ❌ 空：router({})
├── workspaceMember.ts     # ❌ 空：router({})
├── workspace.ts           # ⚠️ 仅 ensureMarketOrganization（抛 NOT_IMPLEMENTED）
├── workspaceAuditLog.ts   # ❌ 空
├── workspaceData.ts       # ❌ 空
├── workspaceCreds.ts      # ❌ 空
├── storageOverage.ts      # ❌ 空
├── taskTemplate.ts        # ❌ 空
├── pageShare.ts           # ❌ 空
├── file.ts                # ❌ 空
├── config.ts              # ❌ 空对象
└── accountDeletion.ts     # ❌ 空
```

**设计说明**（来自代码注释）：
> Cloud overrides this at the same path with the real workspaceRouter backed by cloudDB.
> Only the procedures consumed by submodule (open-source) UI are declared here as typed no-op stubs so the contract type-checks; cloud supplies the real implementations.

即：云端版本在同一路径覆盖真实实现，开源版仅保留类型存根。

---

## 二、官方订阅套餐页面

### 2.1 页面清单

| 页面 | URL | 功能 |
|------|-----|------|
| 套餐 | `/settings/plans` | 查看/升级套餐 |
| 账单 | `/settings/billing` | 账单历史、支付方式 |
| 积分 | `/settings/credits` | 积分余额、充值记录 |
| 用量 | `/settings/usage` | 用量统计、剩余额度 |
| 推荐 | `/settings/referral` | 推荐链接、奖励 |

### 2.2 套餐类型（Plans enum）

```typescript
export enum Plans {
  Free = 'free',        // 免费版
  Hobby = 'hobby',      // 爱好者版
  Premium = 'premium',  // 高级版
  Starter = 'starter',  // 入门版
  Ultimate = 'ultimate', // 旗舰版
}
```

### 2.3 典型套餐功能对比（基于官方页面）

| 功能 | Free | Hobby | Premium | Starter | Ultimate |
|------|------|-------|---------|---------|----------|
| 价格 | $0 | $9/月 | $29/月 | $49/月 | $99/月 |
| 每日消息数 | 有限 | 更多 | 无限 | 无限 | 无限 |
| 模型访问 | 基础 | 进阶 | 全部 | 全部 | 全部 |
| Agent 数量 | 有限 | 更多 | 无限 | 无限 | 无限 |
| 文件上传 | 有限 | 更多 | 无限 | 无限 | 无限 |
| 知识库 | - | 有限 | 完整 | 完整 | 完整 |
| 团队协作 | - | - | - | ✅ | ✅ |
| 优先支持 | - | - | - | - | ✅ |

*注：以上为推测性对比，具体以官方为准*

---

## 三、积分系统（Credits）

### 3.1 积分用途

积分用于按量付费的功能：

| 功能 | 消耗积分 |
|------|---------|
| AI 对话 | 按 token 计费 |
| 图片生成 | 按张计费 |
| 视频生成 | 按秒计费 |
| 文件存储 | 按容量/时间计费 |
| 高级模型 | 额外计费 |

### 3.2 积分获取方式

1. **免费额度**：新用户注册赠送
2. **套餐包含**：订阅套餐每月赠送
3. **充值购买**：按需购买积分包
4. **推荐奖励**：邀请好友获得奖励

---

## 四、计费系统（Billing）

### 4.1 官方支付方式

- **Stripe**：主要支付渠道（信用卡、Apple Pay、Google Pay）
- **可能支持**：PayPal、加密货币等

### 4.2 计费周期

- 月付（Monthly）
- 年付（Yearly）- 通常有折扣

### 4.3 发票管理

- 自动生成电子发票
- 发票历史查询
- 下载 PDF 发票

---

## 五、推荐系统（Referral）

### 5.1 推荐机制

| 项目 | 说明 |
|------|------|
| 推荐链接 | 每个用户唯一推荐链接 |
| 推荐奖励 | 被推荐人订阅后推荐人获得奖励 |
| 奖励形式 | 积分 / 延长订阅 / 现金返还 |
| 追踪方式 | Cookie / 注册关联 |

---

## 六、用量统计（Usage）

### 6.1 统计维度

| 维度 | 说明 |
|------|------|
| 消息用量 | 每日/每月消息数 |
| Token 消耗 | 输入/输出 token 统计 |
| 模型使用 | 各模型使用分布 |
| 存储用量 | 文件/知识库存储 |
| 图片生成 | 生成图片数量 |
| 视频生成 | 生成视频时长 |
| Agent 数量 | 创建的 Agent 数 |
| 活跃天数 | 使用活跃天数 |

### 6.2 展示方式

- 仪表盘图表
- 进度条（已用/总额度）
- 历史趋势
- 按时间段筛选

---

## 七、二次开发方案

### 7.1 方案一：完全自研（推荐）

**适用场景**：需要完全控制、对接国内支付、深度定制

**开发内容**：
1. **数据库设计**
   - 套餐表（plans）
   - 订单表（orders）
   - 支付记录表（payments）
   - 积分表（credits）
   - 积分流水表（credit_transactions）
   - 用量统计表（usage_records）
   - 订阅表（subscriptions）

2. **后端 API**
   - 套餐管理 CRUD
   - 订单管理
   - 支付回调处理
   - 积分充值/消费
   - 用量统计接口
   - 订阅管理

3. **前端页面**
   - 套餐选择页
   - 订单确认页
   - 支付页面
   - 积分余额页
   - 用量统计页
   - 账单历史页
   - 推荐管理页

4. **管理后台**
   - 套餐配置
   - 订单管理
   - 用户管理
   - 数据统计

**开发周期**：约 4-6 周（中等复杂度）

**优点**：
- 完全自主可控
- 可对接国内支付（微信、支付宝）
- 深度定制业务逻辑
- 数据本地化

**缺点**：
- 开发工作量大
- 需要设计完整的计费系统

---

### 7.2 方案二：基于开源框架搭建

**适用场景**：希望快速上线、使用成熟方案

**推荐技术**：

| 方案 | 说明 | 适用场景 |
|------|------|---------|
| **Stripe + LicenseSpring** | 国际支付 + 授权管理 | 面向海外用户 |
| **Lemon Squeezy** | Merchant of Record | 面向海外用户 |
| **Paddle** | Merchant of Record | 面向海外用户 |
| **微信支付 + 自研** | 国内主流支付 | 面向国内用户 |
| **支付宝 + 自研** | 国内主流支付 | 面向国内用户 |

**开发周期**：约 2-4 周

---

### 7.3 方案三：集成 NocoBase 管理后台

**适用场景**：快速搭建管理后台、降低开发成本

**方案**：
- LobeHub 负责前端用户界面
- NocoBase 负责后端管理界面
- 通过 API 或数据库直连交互

**优点**：
- 管理后台开箱即用
- 可视化配置数据表
- 灵活的权限配置
- 可扩展插件

**缺点**：
- 需要维护两套系统
- 数据同步需要处理

---

## 八、微信支付接入方案

### 8.1 接入方式

| 方式 | 说明 | 推荐度 |
|------|------|--------|
| **微信支付商户号** | 直接对接微信支付 API | ⭐⭐⭐⭐⭐ |
| **第三方支付聚合** | 如 Ping++、PayJS 等 | ⭐⭐⭐ |
| **Stripe 微信支付** | 海外 Stripe 支持微信支付 | ⭐⭐（仅限海外主体） |

### 8.2 微信支付产品选择

| 产品 | 适用场景 |
|------|---------|
| JSAPI 支付 | 微信内浏览器/H5 |
| Native 支付 | PC 网站扫码支付 |
| H5 支付 | 手机浏览器 |
| 小程序支付 | 微信小程序 |
| APP 支付 | 移动端 APP |

**推荐**：Web 场景使用 **Native 支付（PC 扫码）+ H5 支付（手机端）**

### 8.3 开发步骤

1. **申请微信支付商户号**
   - 营业执照
   - 对公账户
   - 认证费用

2. **后端开发**
   - 统一下单接口
   - 支付回调通知
   - 订单查询
   - 退款接口

3. **前端开发**
   - 支付二维码展示
   - 支付状态轮询
   - 支付结果页

4. **对账系统**
   - 每日对账
   - 异常处理
   - 财务报表

---

## 九、管理后台功能规划

### 9.1 套餐管理

- 套餐列表
- 新增/编辑套餐
- 套餐价格配置
- 套餐功能项配置
- 套餐上下架

### 9.2 订单管理

- 订单列表
- 订单详情
- 订单状态跟踪
- 手动补单
- 退款处理

### 9.3 用户管理

- 用户列表
- 用户详情
- 用户套餐管理
- 手动调整积分
- 封禁/解封用户

### 9.4 数据统计

- 订阅数据
- 收入统计
- 用户增长
- 用量分布
- 转化率分析

### 9.5 系统设置

- 支付配置
- 积分规则配置
- 推荐奖励配置
- 通知模板配置

---

## 十、关键代码位置

| 功能 | 文件路径 | 状态 |
|------|---------|------|
| 前端套餐页 | `src/business/client/BusinessSettingPages/Plans.tsx` | iframe 占位 |
| 前端账单页 | `src/business/client/BusinessSettingPages/Billing.tsx` | iframe 占位 |
| 前端积分页 | `src/business/client/BusinessSettingPages/Credits.tsx` | iframe 占位 |
| 前端用量页 | `src/business/client/BusinessSettingPages/Usage.tsx` | iframe 占位 |
| 前端推荐页 | `src/business/client/BusinessSettingPages/Referral.tsx` | iframe 占位 |
| iframe 包装器 | `src/business/client/BusinessSettingPages/SubscriptionIframeWrapper.tsx` | 已实现 |
| 套餐类型定义 | `packages/types/src/subscription.ts` | 仅有 Plans enum |
| 商业版服务端路由 | `packages/business-server/src/lambda-routers/` | 空实现 |
| 商业版前端 Hooks | `src/business/client/hooks/` | 部分实现 |
| 商业版前端服务 | `src/business/client/services/` | 部分实现 |

---

## 十一、开发难度评估

| 模块 | 难度 | 开发周期 | 说明 |
|------|------|---------|------|
| 套餐管理 | ⭐⭐ | 1 周 | 基础 CRUD |
| 订单系统 | ⭐⭐⭐ | 1-2 周 | 需要处理支付状态 |
| 微信支付接入 | ⭐⭐⭐ | 1-2 周 | 联调测试较耗时 |
| 积分系统 | ⭐⭐⭐ | 1 周 | 需保证数据一致性 |
| 用量统计 | ⭐⭐⭐ | 1-2 周 | 数据量大需优化 |
| 推荐系统 | ⭐⭐ | 1 周 | 逻辑相对简单 |
| 管理后台 | ⭐⭐⭐⭐ | 2-3 周 | 功能较多 |
| **总计** | - | **8-12 周** | 单人全栈开发 |

---

## 十二、建议开发优先级

1. **第一阶段（MVP）**：套餐管理 + 微信支付 + 积分系统
2. **第二阶段**：用量统计 + 订单管理 + 基础管理后台
3. **第三阶段**：推荐系统 + 数据分析 + 高级功能
