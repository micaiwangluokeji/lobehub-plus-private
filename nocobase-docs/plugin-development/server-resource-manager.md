# ResourceManager 资源管理

NocoBase 的资源管理功能会自动将数据表（Collection）和关联（Association）转换为资源，并内置多种操作类型，让你可以快速构建 REST API。跟传统的 REST API 略有不同，NocoBase 的资源操作不直接依赖 HTTP 请求方法，而是通过显式定义 `:action` 来确定执行的具体操作。

## 自动生成资源

NocoBase 会自动将数据库中定义的 Collection 和 Association 转化为资源。比如定义了 `posts` 和 `tags` 两个集合：

```typescript
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

系统会自动生成以下资源：

- `posts` 资源
- `tags` 资源
- `posts.tags` 关联资源

请求示例：

| 请求方式 | 路径 | 操作 |
|---|---|---|
| `GET` | `/api/posts:list` | 查询列表 |
| `GET` | `/api/posts:get/1` | 查询单条 |
| `POST` | `/api/posts:create` | 新增 |
| `POST` | `/api/posts:update/1` | 更新 |
| `POST` | `/api/posts:destroy/1` | 删除 |

| 请求方式 | 路径 | 操作 |
|---|---|---|
| `GET` | `/api/tags:list` | 查询列表 |
| `GET` | `/api/tags:get/1` | 查询单条 |
| `POST` | `/api/tags:create` | 新增 |
| `POST` | `/api/tags:update/1` | 更新 |
| `POST` | `/api/tags:destroy/1` | 删除 |

| 请求方式 | 路径 | 操作 |
|---|---|---|
| `GET` | `/api/posts/1/tags:list` | 查询某个 `post` 关联的所有 `tags` |
| `GET` | `/api/posts/1/tags:get/1` | 查询某个 `post` 下的单条 `tags` |
| `POST` | `/api/posts/1/tags:create` | 新增某个 `post` 下的单条 `tags` |
| `POST` | `/api/posts/1/tags:update/1` | 更新某个 `post` 下的单条 `tags` |
| `POST` | `/api/posts/1/tags:destroy/1` | 删除某个 `post` 下的单条 `tags` |

## 注册自定义 action

如果内置的 CRUD 操作不够用，可以通过 `resourceManager` 注册自定义 action，比如批量导入、统计汇总等。

```typescript
this.app.resourceManager.define({
  name: 'posts',
  actions: {
    async list(ctx, next) {
      // 自定义列表逻辑
      await next();
    },
    async stats(ctx, next) {
      // 自定义统计逻辑
      ctx.body = { total: 100 };
      await next();
    },
  },
});
```

请求示例：

| 请求方式 | 路径 | 操作 |
|---|---|---|
| `GET` | `/api/posts:stats` | 统计 |

## filter 操作符

NocoBase 提供了丰富的 filter 操作符，用于查询时筛选数据。

| 操作符 | 说明 | 示例 |
|---|---|---|
| `eq` | 等于 | `{ id: { $eq: 1 } }` |
| `ne` | 不等于 | `{ id: { $ne: 1 } }` |
| `gt` | 大于 | `{ age: { $gt: 18 } }` |
| `gte` | 大于等于 | `{ age: { $gte: 18 } }` |
| `lt` | 小于 | `{ age: { $lt: 18 } }` |
| `lte` | 小于等于 | `{ age: { $lte: 18 } }` |
| `in` | 包含 | `{ id: { $in: [1, 2, 3] } }` |
| `notIn` | 不包含 | `{ id: { $notIn: [1, 2, 3] } }` |
| `contains` | 包含（字符串） | `{ title: { $contains: 'hello' } }` |
| `notContains` | 不包含（字符串） | `{ title: { $notContains: 'hello' } }` |
| `startsWith` | 开头 | `{ title: { $startsWith: 'Hello' } }` |
| `endsWith` | 结尾 | `{ title: { $endsWith: 'World' } }` |
| `between` | 范围 | `{ age: { $between: [18, 30] } }` |
| `and` | 并且 | `{ $and: [{ a: 1 }, { b: 2 }] }` |
| `or` | 或者 | `{ $or: [{ a: 1 }, { b: 2 }] }` |

## 相关链接

- [Collections 数据表](https://docs.nocobase.com/cn/plugin-development/server/collections) — 数据表的定义与关联

- [ACL 权限控制](https://docs.nocobase.com/cn/plugin-development/server/acl) — 为资源操作配置权限

- [Middleware 中间件](https://docs.nocobase.com/cn/plugin-development/server/middleware) — 资源级中间件的使用

- [Plugin 插件](https://docs.nocobase.com/cn/plugin-development/server/plugin) — 在插件中注册资源
