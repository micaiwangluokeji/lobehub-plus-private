# 配置 OPENAI_PROXY_URL 环境变量但返回值为空

> **来源**：https://lobehub.com/zh/docs/self-hosting/faq/no-v1-suffix
> **所属**：自托管 > 常见问题

## 问题描述

当设置 `OPENAI_PROXY_URL` 环境变量后，AI 返回的消息可能为空。通常是由于 `OPENAI_PROXY_URL` 配置不正确，尤其是缺少 `/v1` 后缀。

## 解决方案

重新检查并确认 `OPENAI_PROXY_URL` 的格式是否正确，包括是否需要添加 `/v1` 后缀。

例如：
- 代理地址是 `https://your-proxy.com` → 可能需要写成 `https://your-proxy.com/v1`

## 参考讨论

- [Docker 安装，配置好环境变量后，为何返回值是空白？](https://github.com/lobehub/lobehub/discussions/623)
- [使用第三方接口报错的原因](https://github.com/lobehub/lobehub/discussions/734)
- [代理服务器地址填了聊天没任何反应](https://github.com/lobehub/lobehub/discussions/1065)
