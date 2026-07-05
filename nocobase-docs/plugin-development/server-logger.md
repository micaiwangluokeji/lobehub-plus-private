# Logger 日志

NocoBase 日志基于 [Winston](https://github.com/winstonjs/winston) 封装。默认情况下，NocoBase 将日志分为接口请求日志、系统运行日志和 SQL 执行日志。其中接口请求日志和 SQL 执行日志由应用内部打印，插件开发者通常只需要关心插件相关的系统运行日志。

下面介绍在开发插件时，如何创建和打印日志。

## 默认打印方法

NocoBase 提供了系统运行日志的打印方法，日志按照规定字段打印，同时输出到指定文件。

```typescript
// 默认打印方法
app.log.info("message");

// 在中间件中使用
async function (ctx, next) {
  ctx.log.info("message");
}

// 在插件中使用
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

以上方法都遵循下面的用法：

第一个参数为日志消息，第二个参数为可选的 metadata 对象，可以是任意键值对。其中 `module`、`submodule`、`method` 会被提取为单独字段，其余字段放到 `meta` 字段中。

```typescript
app.log.info('message', {
  module: 'module',
  submodule: 'submodule',
  method: 'method',
  key1: 'value1',
  key2: 'value2',
});
// => level=info timestamp=2023-12-27 10:30:23 message=message module=module submodule=submodule method=method meta={"key1": "value1", "key2": "value2"}

app.log.debug();
app.log.warn();
app.log.error();
```

## 输出到其他文件

如果想沿用系统默认的打印方法，不过不想输出到默认文件中，可以用 `createSystemLogger` 创建一个自定义的系统日志实例。

```typescript
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // 是否将 error 级别日志单独输出到 xxx_error.log
});
```

## 自定义日志

如果不想使用系统提供的打印方法，想直接用 Winston 原生的方式，可以通过以下方法创建日志。

### `createLogger`

```typescript
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options` 在原来 `winston.LoggerOptions` 的基础上进行了扩展。

- `transports` - 可以使用 `'console' | 'file' | 'dailyRotateFile'` 应用预置的输出方式。

- `format` - 可以使用 `'logfmt' | 'json' | 'delimiter'` 应用预置的打印格式。

### `app.createLogger`

在多应用场景下，如果你希望自定义的日志输出到当前应用名称的目录下，可以用这个方法。

```typescript
app.createLogger({
  dirname: '',
  filename: 'custom', // 输出到 /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

使用场景和用法同 `app.createLogger`。

```typescript
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // 输出到 /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```
