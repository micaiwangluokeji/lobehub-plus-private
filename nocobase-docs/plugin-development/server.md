# 概述

NocoBase 的服务端插件可以做很多事：定义数据表、写自定义接口、管理权限、监听事件、注册定时任务，甚至扩展 CLI 命令。所有这些能力都通过一个统一的 Plugin 类来组织。

| 我想要…… | 去哪里看 |
|---|---|
| 了解插件类的生命周期和 `app` 成员 | [Plugin 插件](https://docs.nocobase.com/cn/plugin-development/server/plugin) |
| 对数据库做 CRUD、事务管理 | [Database 数据库](https://docs.nocobase.com/cn/plugin-development/server/database) |
| 用代码定义或扩展数据表 | [Collections 数据表](https://docs.nocobase.com/cn/plugin-development/server/collections) |
| 插件升级时做数据迁移 | [Migration 数据迁移](https://docs.nocobase.com/cn/plugin-development/server/migration) |
| 管理多个数据源 | [DataSourceManager 数据源管理](https://docs.nocobase.com/cn/plugin-development/server/data-source-manager) |
| 注册自定义接口和资源操作 | [ResourceManager 资源管理](https://docs.nocobase.com/cn/plugin-development/server/resource-manager) |
| 配置接口权限 | [ACL 权限控制](https://docs.nocobase.com/cn/plugin-development/server/acl) |
| 添加请求/响应拦截器或中间件 | [Context 上下文](https://docs.nocobase.com/cn/plugin-development/server/context) 和 [Middleware 中间件](https://docs.nocobase.com/cn/plugin-development/server/middleware) |
| 监听应用或数据库事件 | [Event 事件](https://docs.nocobase.com/cn/plugin-development/server/event) |
| 使用缓存提升性能 | [Cache 缓存](https://docs.nocobase.com/cn/plugin-development/server/cache) |
| 注册定时任务 | [CronJobManager 定时任务](https://docs.nocobase.com/cn/plugin-development/server/cron-job-manager) |
| 支持多语言 | [I18n 国际化](https://docs.nocobase.com/cn/plugin-development/server/i18n) |
| 自定义日志输出 | [Logger 日志](https://docs.nocobase.com/cn/plugin-development/server/logger) |
| 扩展 CLI 命令 | [Command 命令行](https://docs.nocobase.com/cn/plugin-development/server/command) |
| 编写测试用例 | [Test 测试](https://docs.nocobase.com/cn/plugin-development/server/test) |
