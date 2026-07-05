# 解决使用代理时遇到证书验证错误的问题

> **来源**：https://lobehub.com/zh/docs/self-hosting/faq/proxy-with-unable-to-verify-leaf-signature
> **所属**：自托管 > 常见问题

## 问题描述

私有化部署 LobeHub 时使用代理（如 Surge），可能会遇到 Node.js 的证书验证错误：

```
[TypeError: fetch failed] { cause: [Error: unable to verify the first certificate]
  { code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' } }
```

原因：代理服务器使用了自签名证书或中间人证书，Node.js 默认不信任。

## 临时解决方案

设置环境变量跳过证书验证：

```bash
# 直接启动
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run start

# Docker 部署
docker run -e NODE_TLS_REJECT_UNAUTHORIZED=0 <其他参数> <镜像名>
```

⚠️ **安全警告**：此方法会降低安全性，仅建议在完全信任网络环境使用。

## 推荐方案

1. 正确安装中间人证书
2. 使用由受信任 CA 签发的证书
3. 在代码或环境中正确设置证书链
