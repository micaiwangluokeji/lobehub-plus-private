---
name: admin-fixes-batch-review-plan
overview: 修复管理后台 5 个问题：Payment/PaymentSDK 页面分析、4 个页面 i18n 中文显示、LoginConfig 保存无效、Decoration 主题与外观整合、Navigation 可见性修复及全页面保存功能检查。
todos:
  - id: fix-issue2-i18n
    content: 补全 locales JSON 文件：从 src/locales/default/admin.ts 提取全部中文 key 写入 locales/en-US/admin.json 和 locales/zh-CN/admin.json
    status: completed
  - id: fix-issue1-payment-merge
    content: 合并 payment-sdk 到 PaymentSettings：删除独立路由/组件/侧边栏项，在 PaymentSettings 中新增 SDK 状态 Tab
    status: completed
    dependencies:
      - fix-issue2-i18n
  - id: fix-issue3-login-config
    content: 修复 LoginConfig 保存：新建 loginConfig.ts 服务层（TRPC dictConfig），改造 LoginConfigPage 使用新服务
    status: completed
    dependencies:
      - fix-issue2-i18n
  - id: fix-issue4-decoration-theme
    content: 增强装修中心主题设置：新增 primaryColor/neutralColor 字段，新建 decoration.ts 服务层，修复 handleSave 补全所有字段
    status: completed
    dependencies:
      - fix-issue2-i18n
  - id: fix-issue5-decoration-nav
    content: 修复装修中心导航可见性：改用前端 7 项导航，角色改 free_user/vip_user，保存调用 updateNavVisibility
    status: completed
    dependencies:
      - fix-issue4-decoration-theme
  - id: final-verify
    content: 最终验证：lint 检查 + TypeScript 编译 + 提交全部更改
    status: completed
    dependencies:
      - fix-issue1-payment-merge
      - fix-issue3-login-config
      - fix-issue5-decoration-nav
---

## 产品概述

修复管理后台 5 个已知问题：合并 payment/payment-sdk 页面、补全 4 页 i18n JSON 中文翻译、修复 LoginConfig 保存（改用 TRPC + dictConfig 存储）、装修中心增强（集成全局外观设置）、修复装修中心导航可见性（改用前端导航+修复保存）。全面检查和修复所有页面的保存功能有效性。

## 核心功能

### 问题 1: Payment 与 Payment-SDK 合并

- 删除独立的 /admin/payment-sdk 路由和页面组件
- 将 SDK 状态信息作为 PaymentSettings 的第三个 Tab（"SDK 状态"）展示
- 移除侧边栏中的 "支付 SDK" 导航项

### 问题 2: 4 页显示英文（membership/orders/refundRequests/dictConfigs）

- `locales/en-US/admin.json` 和 `locales/zh-CN/admin.json` 补充全部缺失的中文 i18n key
- 需要补充的 key 范围：membership.*、orders.*、refund.*、dictConfig.*、loginConfig.*、decoration.*、paymentSdk.*、dashboard.* 趋势、settings.tab*、phoneLogin.*、agreement.*、navGroup.*
- 从 `src/locales/default/admin.ts` 提取中文翻译写入 JSON 文件

### 问题 3: LoginConfig 保存无效

- 根因：使用原生 `fetch('/api/v1/admin/login-config')` 调用不存在的 REST API
- 修复：改用 TRPC 模式，通过已有的 `lambdaClient.dictConfig.*` 存储登录配置（序列化为 JSON 存入 dict_configs）
- 新建 `src/services/admin/loginConfig.ts` 服务文件
- 加载时从 dictConfig 读取 key='login_config' 的值，反序列化为表单字段
- 保存时序列化为 JSON，通过 `lambdaClient.dictConfig.upsert.mutate()` 写入

### 问题 4: 装修中心外观设置增强

- 主题设置 Tab 新增字段：primaryColor（全局主题色）、neutralColor（中性色）
- 修复 handleSave 补全 favicon、themeColor 的保存逻辑
- 保留用户个人 /settings/appearance 的设置独立性（superadmin 设置的是全局默认值）
- 后端通过 dictConfig 存储全局外观配置（key='appearance_config'）

### 问题 5: 装修中心导航可见性修复

- 将导航项列表从 admin 侧边栏 23 项改为前端导航 7 项（home/discover/tasks/pages/image/resource/memory）+ chat
- 角色从 free/pro 改为 free_user/vip_user（与已有 NavVisibility.tsx 一致）
- 修复 handleSave：调用 `adminSettingsService.updateNavVisibility()` 传递正确格式的键值对
- 删除侧边栏中装修中心的 agreement 菜单项（不相关）

## 技术方案

### 技术栈

- 与项目现有技术栈一致：Next.js 16 + React 19 + TypeScript + antd + TRPC + react-i18next
- 无新增依赖

### 修改策略

#### 问题 1: 合并 Payment 与 Payment-SDK

**涉及文件**：

- [DELETE] `src/features/Admin/Payment/PaymentSdkConfig.tsx` - 删除独立组件
- [DELETE] `src/routes/(main)/admin/payment-sdk/index.tsx` - 删除路由页面
- [MODIFY] `src/features/Admin/Payment/PaymentSettings.tsx` - 加入第三个 Tab（SDK 状态）
- [MODIFY] `src/features/Admin/Layout/AdminSidebar.tsx` - 移除 payment-sdk 导航项
- [MODIFY] `src/spa/router/desktopRouter.config.tsx` - 移除 payment-sdk 路由
- [MODIFY] `src/spa/router/desktopRouter.config.desktop.tsx` - 移除 payment-sdk 路由

**PaymentSettings 改造方案**：

- 将现有的三个 Card 包裹为 antd Tabs 的三个 Tab 项
- 新增第四个 Tab "SDK 状态"，内容来自 PaymentSdkConfig 的 SDK 状态卡片
- 保存按钮放在 Tabs 外部，一个按钮保存所有 Tab 数据（SDK 状态只读不动）

#### 问题 2: i18n JSON 补全

**涉及文件**：

- [MODIFY] `locales/en-US/admin.json` - 补充全部缺失的 key
- [MODIFY] `locales/zh-CN/admin.json` - 补充全部缺失的 key

**方案**：

- 从 `src/locales/default/admin.ts`（完整中文源文件）提取所有 key-value
- 合并到两个 JSON 文件中
- 保持 JSON 结构与 TS 源文件一致

#### 问题 3: LoginConfig 改用 TRPC + dictConfig

**涉及文件**：

- [NEW] `src/services/admin/loginConfig.ts` - 新建服务层
- [MODIFY] `src/features/Admin/LoginConfig/LoginConfigPage.tsx` - 改用新服务层

**方案**：

- 利用已有的 `dictConfig` 系统存储登录配置
- 服务层：从 `lambdaClient.dictConfig.upsert.mutate()` 读写 key='login_config' 的 JSON 值
- 通过 `lambdaClient.dictConfig.list.query()` 加载配置
- 使用 `toUIConfig`/`toBackendConfig` 模式转换前后端格式（序列化/反序列化 JSON）

#### 问题 4: 装修中心外观增强

**涉及文件**：

- [MODIFY] `src/features/Admin/Decoration/DecorationPage.tsx` - 增加字段 + 修复保存
- [NEW] `src/services/admin/decoration.ts` - 新建服务层（封装 dictConfig 读写）
- [MODIFY] `src/locales/default/admin.ts` - 新增 i18n key
- [MODIFY] `packages/locales/src/default/admin.ts` - 新增 i18n key

**方案**：

- 主题设置 Tab 新增：primaryColor（全局主题色选择器）、neutralColor（中性色选择器）
- 装修中心的数据通过 dictConfig 存储（key='appearance_config'）
- 保存时：从 form 获取全部字段 -> 序列化为 JSON -> 通过 dictConfig.upsert 写入
- 与用户个人 /settings/appearance 的关系：全局设置作为 featureFlags 的默认值，用户可在个人设置中覆盖

#### 问题 5: 装修中心导航可见性修复

**涉及文件**：

- [MODIFY] `src/features/Admin/Decoration/DecorationPage.tsx` - 改用前端导航 + 修复保存

**方案**：

- 导航项列改为前端导航：home, discover, tasks, pages, image, resource, memory, chat
- 角色改为：free_user, vip_user
- 保存时调用 `adminSettingsService.updateNavVisibility()` 
- 参考 `NavVisibility.tsx` 的 key 命名格式：`{navId}_{role}` -> value boolean
- 加载时从 `adminSettingsService.getGlobalConfig()` 获取当前 featureFlags 状态

### 架构设计

```
+-------------------+     +---------------------------+
|  Admin Pages      |     |  Backend (via TRPC)       |
|                   |     |                           |
|  PaymentSettings  |---->|  lambdaClient.payment.*   |
|  MembershipLevel  |---->|  lambdaClient.membership  |
|  DictConfigList   |---->|  lambdaClient.dictConfig  |
|  LoginConfigPage  |---->|  lambdaClient.dictConfig  | (new - reuse dictConfig)
|  DecorationPage   |---->|  lambdaClient.config.*    | (nav visibility)
|                   |     |  lambdaClient.dictConfig   | (appearance config - new)
+-------------------+     +---------------------------+
```

### 实施注意事项

- **依赖顺序**: Issue 2 (i18n) 应先完成，因为其他修改可能依赖新的 i18n key
- **无需后端新增路由**: LoginConfig 和 Decoration 都复用已有的 dictConfig 和 config 系统
- **外现设置作用域**: 全局设置 -> 用户可覆盖，通过 featureFlags 机制实现
- **导航可见性格式**: 与 NavVisibility.tsx 完全一致的 key 格式 `navId_role`
- **删除文件安全**: payment-sdk 路由/组件/侧边栏项全部删除，确保无残留引用

### 目录结构

```
src/features/Admin/
├── Decoration/
│   └── DecorationPage.tsx        # [MODIFY] 增加字段 + 修复保存
├── LoginConfig/
│   └── LoginConfigPage.tsx       # [MODIFY] 改用 TRPC dictConfig
├── Payment/
│   ├── PaymentSettings.tsx       # [MODIFY] 合并 SDK 状态为第 4 Tab
│   └── PaymentSdkConfig.tsx      # [DELETE] 删除独立组件
src/services/admin/
├── loginConfig.ts                # [NEW] LoginConfig 服务层（TRPC + dictConfig）
├── decoration.ts                 # [NEW] 装修中心服务层（dictConfig 存储）
locales/
├── en-US/admin.json              # [MODIFY] 补全全部缺失中文 key
└── zh-CN/admin.json              # [MODIFY] 补全全部缺失中文 key
```

### 各页面保存按钮最终状态

| 页面 | 当前状态 | 修复后 | 说明 |
| --- | --- | --- | --- |
| Payment | 有效 | 有效 | 不变 |
| Membership | 有效 | 有效 | 不变 |
| Orders | 只读 | 只读 | 不变 |
| RefundRequests | 有效 | 有效 | 不变 |
| DictConfigs | 有效 | 有效 | 不变 |
| LoginConfig | 无效 | 有效 | 改用 TRPC dictConfig |
| Decoration 主题 | 部分有效 | 有效 | 补全字段 + 通过 dictConfig 持久化 |
| Decoration 导航 | 无效 | 有效 | 换前端导航 + 调用 updateNavVisibility |
| Agreement | 无保存 | 无保存 | 静态页面，不变 |


## Agent Extensions

### Skill

- **self-improving agent**: 记录本次修复中发现的 i18n 工作流问题和 TRPC 服务层模式，避免未来开发中再次出现类似的保存功能缺失问题