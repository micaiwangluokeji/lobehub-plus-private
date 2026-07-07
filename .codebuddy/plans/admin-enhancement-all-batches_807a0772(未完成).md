---
name: admin-enhancement-all-batches
overview: 分 4 批次完成管理后台 14 项增强任务：第 1 批紧急修复+基础设施（消息500修复/侧边栏重归类/支付补字段/i18n）、第 2 批页面改造（Dashboard优化/站点配置Tab化/登录配置页/装修中心）、第 3 批支付SDK+微信登录（wechatpay/微信OAuth/支付宝）、第 4 批用户端功能（手机号登录/注册协议/注册方式选择）
todos:
  - id: batch-1-message-500-fix
    content: 修复消息管理 Zod 500 错误：在 services/admin/messages.ts list 方法中兼容空 filter
    status: pending
  - id: batch-1-sidebar-restructure
    content: 侧边栏重归类为 6 个分组（数据看板/系统管理/智能体/AI/财务/系统管理），移除 isComingSoon 白名单
    status: pending
    dependencies:
      - batch-1-message-500-fix
  - id: batch-1-payment-fields-enhance
    content: 支付配置补齐微信/支付宝缺失字段（payVersion/merchantType/paySignKey/logo），更新转换函数和 UI
    status: pending
    dependencies:
      - batch-1-sidebar-restructure
  - id: batch-1-i18n-complete
    content: 更新中英文 i18n 文件：新增分组名称 key、支付字段 key、补全现有 nav.* 缺失 key
    status: pending
    dependencies:
      - batch-1-payment-fields-enhance
  - id: batch-2-dashboard-charts
    content: Dashboard 增加用户趋势图、收入趋势图、Token 消耗排名（recharts），扩展 dashboard service
    status: pending
  - id: batch-2-system-settings-tabs
    content: 站点配置改造为 antd Tabs 布局（基础/注册/功能/通知 4 个 Tab），扩展 settings service
    status: pending
    dependencies:
      - batch-2-dashboard-charts
  - id: batch-2-login-config
    content: 新建登录配置管理页面（LoginConfigPage + loginConfigService + 路由注册）
    status: pending
    dependencies:
      - batch-2-system-settings-tabs
  - id: batch-2-decoration-center
    content: 新建装修中心页面（DecorationPage：主题设置 + 导航可见性控制 + 路由注册）
    status: pending
    dependencies:
      - batch-2-login-config
  - id: batch-3-wechat-pay-sdk
    content: 安装 wechatpay-node-v3，实现统一下单 API 和支付回调通知处理
    status: pending
  - id: batch-3-wechat-oauth
    content: better-auth 微信 OAuth provider 集成，前端登录页增加微信登录按钮
    status: pending
    dependencies:
      - batch-3-wechat-pay-sdk
  - id: batch-3-alipay-sdk
    content: 集成支付宝 SDK（alipay-sdk），实现支付和回调
    status: pending
    dependencies:
      - batch-3-wechat-oauth
  - id: batch-4-phone-login
    content: 手机号登录支持：短信验证码服务商接入 + 前端手机号登录组件
    status: pending
  - id: batch-4-policy-page
    content: 新建注册协议/隐私协议静态页面，受 showPolicyAgreement 开关控制
    status: pending
    dependencies:
      - batch-4-phone-login
  - id: batch-4-register-method-selector
    content: 用户端注册表单增加注册方式选择（账号/手机号/微信），受 allowedRegisterMethods 控制
    status: pending
    dependencies:
      - batch-4-policy-page
---

## 产品概述

参照 LifeOS 管理后台的完善度，分 4 个批次补齐 LobeHub 管理后台的差距。共 14 个任务，覆盖消息管理修复、侧边栏重构、支付配置增强、Dashboard 可视化、站点配置 Tab 化、登录配置管理、装修中心、SDK 集成、用户端注册功能。

## 核心功能

### 第 1 批：紧急修复 + 基础设施（3-4 小时）

1. 修复 `/admin/messages` Zod 500 错误（消息列表首次加载时未传 filter 参数导致后端校验失败）
2. 侧边栏重归类为 6 个分组（数据看板/系统管理/智能体管理/AI 管理/财务中心/系统管理），移除 isComingSoon 白名单
3. 支付配置补齐字段（微信：payVersion/merchantType/paySignKey/payAuthDir/logo；支付宝：logo）
4. i18n 同步更新（中英文）

### 第 2 批：页面改造（6-8 小时）

5. Dashboard 增加用户趋势图、收入趋势图、Token 消耗排名
6. 站点配置改造为 antd Tabs 布局（基础设置/注册设置/功能开关/通知设置）
7. 新建登录配置管理页面（登录方式/注册方式/协议开关/多端登录）
8. 新建装修中心页面（外观设置 + 导航可见性配置）

### 第 3 批：支付 SDK + 微信登录（4-6 小时）

9. 安装 wechatpay-node-v3 SDK，实现统一下单/回调
10. 微信 OAuth 登录集成（better-auth 微信 provider）
11. 支付宝 SDK 集成

### 第 4 批：用户端功能（3-4 小时）

12. 手机号登录支持（短信验证码服务商接入）
13. 注册协议/隐私协议页面
14. 用户端注册时选择登录方式

## 技术方案

### 技术栈

- **前端框架**: Next.js 16 + React 19 + TypeScript（SPA with react-router-dom）
- **UI 组件库**: @lobehub/ui、antd 5.x、antd-style（CSS-in-JS）
- **状态管理**: zustand
- **数据请求**: SWR（客户端）、tRPC（类型安全后端调用）、REST（AdminApiBase）
- **国际化**: react-i18next（src/locales/default/ + locales/en-US/ + locales/zh-CN/）
- **图表**: @ant-design/charts 或 recharts（Dashboard 趋势图）
- **后端 ORM**: Drizzle ORM + PostgreSQL
- **测试**: Vitest
- **包管理**: pnpm / bun

### 架构设计

#### 现有模式

- **Service 层混合模式**：部分使用 REST（继承 `AdminApiBase`，baseUrl=`/api/v1`），部分使用 tRPC（`lambdaClient`）
- **UI 组件路径**: `src/features/Admin/<Domain>/<Component>.tsx`
- **路由注册**: `src/spa/router/desktopRouter.config.tsx`（懒加载 `dynamicElement`）
- **侧边栏布局**: `src/features/Admin/Layout/AdminSidebar.tsx`（NavPanelPortal 渲染）
- **布局守卫**: `src/routes/(main)/admin/_layout/index.tsx`（AdminGuard + AdminSidebar + Outlet）

#### 新增/修改模块架构

**第 1 批**（最小改动原则）：

| 模块 | 修改文件 | 改动类型 |
| --- | --- | --- |
| 消息管理 | src/services/admin/messages.ts | 修复 filter 兼容 |
| 侧边栏 | src/features/Admin/Layout/AdminSidebar.tsx | 重构导航分组 |
| 支付配置 | src/services/admin/payment.ts + src/features/Admin/Payment/PaymentSettings.tsx | 扩展字段 |
| i18n | src/locales/default/admin.ts + locales/en-US/admin.ts | 新增 key |


**第 2 批**（组件新建为主）：

| 模块 | 新增/修改文件 | 说明 |
| --- | --- | --- |
| Dashboard | src/features/Admin/Dashboard/index.tsx + 新增趋势子组件 | 复用 StatCard 模式 |
| 站点配置 | src/features/Admin/Settings/SystemSettings.tsx | 重构为 Tab 布局 |
| 登录配置 | NEW src/features/Admin/LoginConfig/ + NEW src/services/admin/loginConfig.ts | 新建模块 |
| 装修中心 | NEW src/features/Admin/Decoration/ + NEW src/services/admin/decoration.ts | 新建模块 |
| 路由 | src/spa/router/desktopRouter.config.tsx | 新增 2 条路由 |


**第 3 批**（后端集成 + SDK）：

| 模块 | 说明 |
| --- | --- |
| wechatpay-node-v3 | pnpm add wechatpay-node-v3；后端 apps/server/ 新增支付模块 |
| 微信 OAuth | 配置 better-auth 微信 provider |
| 支付宝 SDK | 集成 alipay-sdk |


**第 4 批**（用户端增强）：

| 模块 | 主要涉及文件 |
| --- | --- |
| 手机号登录 | src/features/Auth/ 新增手机号登录组件 + 后端短信服务 |
| 注册协议 | 新建协议页面 + 配置开关 |
| 注册方式选择 | 登录/注册表单增加方式切换 |


### 实现注意事项

#### 第 1 批关键细节

**1.1 消息管理 500 修复**

- 根因：后端 Zod 校验要求 `topicId` 或 `userId` 必传，但前端 `MessageList.fetchData` 初始调用未传
- 修复位置：`src/services/admin/messages.ts` 的 `list` 方法
- 方案：在 `list()` 调用时，若未传 filter 参数，传一个空对象 `{}` 或默认 `{ topicId: undefined }` 使校验通过；或调整后端校验规则为可选
- 不在 `MessageList.tsx` 层面修改，保持业务组件纯净

**1.2 侧边栏重归类**

- 当前 `AdminSidebar.tsx` 使用 `{ type: 'group' }` 和 `{ type: 'divider' }` 作为分割，但 `type: 'group'` 渲染为 `null`（仅占位）
- 重构方案：在 navItems 数组中，每个分组前插入一个 `{ type: 'group-label', label: t('navGroup.xxx') }` 项，侧边栏渲染时对 `group-label` 类型渲染为分组标题文本
- 新增分组标签 i18n key：`navGroup.dashboard`、`navGroup.systemManagement`、`navGroup.agentManagement`、`navGroup.aiManagement`、`navGroup.financeCenter`、`navGroup.settings`
- 同一分组内的 items 不再用 divider 分割，改用间距区分
- 移除 `isComingSoon` 白名单逻辑（revenue 等页面已有路由文件），所有页面均可点击
- 新增 `nav.systemHealth`、`nav.revenue`、`nav.subscriptions`、`nav.creditTransactions`、`nav.spend` i18n key 补全现有路由引用

**1.3 支付配置补字段**

- `PaymentConfigWechat` 接口新增：`payVersion?: 'V2' | 'V3'`、`merchantType?: 'ordinary' | 'service_provider'`、`paySignKey?: string`、`payAuthDir?: string`、`logo?: string`
- `PaymentConfigAlipay` 接口新增：`logo?: string`
- `PaymentSettings.tsx` 微信卡片新增：V2/V3 切换 Select、商户类型 Select、支付签名密钥输入框、证书授权目录输入框、LOGO URL 输入框
- `toUIConfig`/`toBackendConfig` 同步更新转换逻辑

#### 第 2 批关键细节

**2.1 Dashboard 趋势图**

- 新增子组件：`src/features/Admin/Dashboard/UserTrendChart.tsx`（折线图，近 15 天注册趋势）、`RevenueTrendChart.tsx`（折线图，近 15 天收入/订单趋势）、`TokenRanking.tsx`（排名列表，按模型/供应商耗用 Token 排名）
- 数据来源：扩展 `adminDashboardService` 增加 `getUserTrend()`、`getRevenueTrend()`、`getTokenRanking()` 方法；或新增 `adminTrendService`
- 图表库优先选择 recharts（更轻量），其次 @ant-design/charts
- 排名切换 Tab：按模型（models）/按供应商（providers）

**2.2 站点配置 Tab 改造**

- 使用 antd `<Tabs>` 组件，4 个 Tab 项：
- **基础设置**：systemName、defaultLanguage、logo URL、ICP 备案号、客服联系方式
- **注册设置**：registrationEnabled、默认角色选择、新用户赠送积分（creditAmount）、新用户赠送算力（computeAmount）
- **功能开关**：会员功能开关列表（featureFlags 的 UI 化呈现，每个功能一个 Switch）
- **通知设置**：SMTP 配置（server/port/username/password/fromAddress）+ 短信配置（provider/apiKey/signName）
- 后端：扩展 `adminSettingsService.updateSystemConfig` 支持更多字段；云端 platform 表或 dict_configs 表存储

**2.3 登录配置页面**

- 新建模块路径：`src/features/Admin/LoginConfig/LoginConfigPage.tsx`
- 表单字段：allowedLoginMethods（多选：account/wechat/phone）、allowedRegisterMethods（多选）、defaultLoginMethod（单选）、allowMultipleLogin（Switch）、showPolicyAgreement（Switch）
- 后端服务：新建 `src/services/admin/loginConfig.ts`，通过 REST `AdminApiBase` 或 tRPC 调用
- 路由注册：`/admin/login-config`

**2.4 装修中心页面**

- 新建模块路径：`src/features/Admin/Decoration/DecorationPage.tsx`
- Tab 1 - 主题设置：Logo 上传、站点名称、favicon（URL 输入）、主题色（ColorPicker）
- Tab 2 - 导航可见性：按 Free/Pro 角色控制哪些侧边栏导航项可见（表格形式，行为角色，列为导航项，单元格为 Switch）
- 后端服务：新建 `src/services/admin/decoration.ts`；导航可见性可复用 `adminSettingsService.updateNavVisibility`
- 路由注册：`/admin/decoration`

#### 第 3 批关键细节

**3.1 wechatpay-node-v3 SDK**

- 安装：`pnpm add wechatpay-node-v3`
- 后端 `apps/server/` 中新建 `src/modules/payment/` 模块
- 统一下单 API：接收 orderId/amount/openId，返回 prepayId
- 回调通知：验证签名，更新订单状态

**3.2 微信 OAuth 登录**

- 在 `better-auth` 配置中添加微信 OAuth provider
- 后端新增 `/api/auth/wechat` 路由处理回调
- 前端登录页增加"微信登录"按钮

#### 第 4 批关键细节

**4.1 手机号登录**

- 短信验证码服务商：阿里云 SMS 或腾讯云 SMS
- 后端新增短信发送 API + 验证码校验逻辑
- 前端新增手机号输入 + 验证码输入组件

**4.2 注册协议页面**

- 新建静态页面显示隐私协议/服务条款
- 接入 showPolicyAgreement 开关控制显示

**4.3 注册方式选择**

- 注册表单增加方式切换 Tab（账号密码/手机号/微信）
- 受 allowedRegisterMethods 配置控制