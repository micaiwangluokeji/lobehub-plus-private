# 编写第一个插件

这篇文档会带你从零创建一个可在页面中使用的区块插件，帮你了解 NocoBase 插件的基本结构和开发流程。

## 前置条件

开始之前，确保你已经安装好了 NocoBase。如果还没有安装，可以参考：

- [使用 create-nocobase-app 安装](https://docs.nocobase.com/cn/get-started/installation/create-nocobase-app)

- [从 Git 源码安装](https://docs.nocobase.com/cn/get-started/installation/git)

安装完成后就可以开始了。

## 第 1 步：通过 CLI 创建插件骨架

在仓库根目录执行以下命令，快速生成一个空的插件：

```
yarn pm create @my-project/plugin-hello
```

命令执行成功后，会在 `packages/plugins/@my-project/plugin-hello` 目录下生成基础文件，默认结构如下：

```
├─ /packages/plugins/@my-project/plugin-hello
 ├─ package.json
 ├─ README.md
 ├─ client-v2.d.ts
 ├─ client-v2.js
 ├─ server.d.ts
 ├─ server.js
 └─ src
 ├─ index.ts # 默认导出服务端插件
 ├─ client-v2 # 客户端代码存放位置
 │ ├─ index.tsx # 默认导出的客户端插件类
 │ ├─ plugin.tsx # 插件入口（继承 @nocobase/client-v2 Plugin）
 │ ├─ models # 可选：前端模型（如流程节点）
 │ │ └─ index.ts
 │ └─ utils
 │ ├─ index.ts
 │ └─ useT.ts
 ├─ server # 服务端代码存放位置
 │ ├─ index.ts # 默认导出的服务端插件类
 │ ├─ plugin.ts # 插件入口（继承 @nocobase/server Plugin）
 │ ├─ collections # 数据表配置
 │ │ └─ index.ts
 │ └─ migrations # 数据库迁移脚本
 │ └─ index.ts
```

## 第 2 步：创建服务端插件

首先在 `src/server/plugin.ts` 中创建服务端插件类，定义区块的数据模型：

```typescript
import { defineCollection } from '@nocobase/database';
import { Migration, Plugin } from '@nocobase/server';

export class PluginHelloServer extends Plugin {
  async load() {
    // 注册数据表
    this.db.defineCollection({
      name: 'greetings',
      fields: [
        { type: 'string', name: 'message' },
      ],
    });
  }
}

export default PluginHelloServer;
```

## 第 3 步：创建客户端插件

在 `src/client-v2/plugin.tsx` 中创建客户端插件类，定义区块组件：

```typescript
import { BlockPlugin, useFields, useCollection, useRecord } from '@nocobase/client-v2';
import React from 'react';

class PluginHelloClient extends BlockPlugin {
  components = {
    HelloBlock: () => {
      const record = useRecord();
      return <div>Hello, {record.data?.message || 'World'}!</div>;
    },
  };
}
```

## 第 4 步：构建和打包插件

完成代码开发后，需要构建插件以生成可用于生产的文件：

```bash
yarn build @my-project/plugin-hello
```

构建完成后，可以使用以下命令生成可分发的压缩包：

```bash
yarn nocobase tar @my-project/plugin-hello
```

## 相关链接

- [插件开发概述](https://docs.nocobase.com/cn/plugin-development/) — 了解插件的整体架构

- [服务端开发概述](https://docs.nocobase.com/cn/plugin-development/server/) — 服务端插件开发的详细文档

- [客户端开发概述](https://docs.nocobase.com/cn/plugin-development/client/) — 客户端插件开发的详细文档
