# Cache 缓存

NocoBase 的 Cache 模块基于 [node-cache-manager](https://github.com/node-cache-manager/node-cache-manager) 封装，为插件开发提供缓存功能。内置了两种缓存类型：

- **memory** ——基于 lru-cache 的内存缓存，由 node-cache-manager 默认提供

- **redis** ——基于 node-cache-manager-redis-yet 的 Redis 缓存

更多缓存类型可以通过 API 扩展注册。

## 基本用法

### app.cache

`app.cache` 是应用级别的默认缓存实例，可以直接使用。

```typescript
// 设置缓存
await app.cache.set('key', 'value', { ttl: 3600 }); // TTL 单位：秒

// 获取缓存
const value = await app.cache.get('key');

// 删除缓存
await this.app.cache.del('key');
```

### ctx.cache

在中间件或资源操作中，可以通过 `ctx.cache` 访问缓存。

```typescript
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // 缓存未命中，从数据库获取
    data = await this.getDataFromDatabase();
    // 存入缓存，有效期 1 小时
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## 创建自定义缓存

如果需要创建独立的缓存实例（比如不同的命名空间或配置），可以使用 `app.cacheManager.createCache()` 方法。

```typescript
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // 创建一个带前缀的缓存实例
    const myCache = await this.app.cacheManager.createCache({
      name: 'custom', // 缓存名称
      store: 'memory', // 缓存类型：'memory' | 'redis'
      ttl: 300, // 默认 TTL（秒）
    });

    // 使用自定义缓存
    await myCache.set('key', 'value');
    const value = await myCache.get('key');
  }
}
```

## 配置说明

Cache 模块的配置项：

| 配置项 | 类型 | 说明 |
|---|---|---|
| `name` | string | 缓存实例名称，用于区分不同缓存 |
| `store` | 'memory' \| 'redis' | 缓存存储类型 |
| `ttl` | number | 默认过期时间（秒） |

## 相关链接

- [Plugin 插件](https://docs.nocobase.com/cn/plugin-development/server/plugin) — 在插件中使用缓存

- [Middleware 中间件](https://docs.nocobase.com/cn/plugin-development/server/middleware) — 在中间件中集成缓存

- [Event 事件](https://docs.nocobase.com/cn/plugin-development/server/event) — 监听缓存相关事件
