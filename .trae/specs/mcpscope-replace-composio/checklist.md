# 魔搭 MCP 替代 Composio - 验证清单

## 功能验证

- [ ] Checklist 1: `/settings/skill` 页面显示魔搭 MCP 服务列表（飞书、钉钉、企业微信等）
- [ ] Checklist 2: 技能商店弹窗 LobeHub tab 显示魔搭 MCP 服务，替换原来的 Composio 工具
- [ ] Checklist 3: 用户可以点击 Connect 按钮连接魔搭 MCP 服务
- [ ] Checklist 4: 连接成功后服务状态变为活跃
- [ ] Checklist 5: 用户可以断开已连接的魔搭 MCP 服务
- [ ] Checklist 6: 断开后服务状态变为断开
- [ ] Checklist 7: 无权限用户的 Connect 按钮被禁用
- [ ] Checklist 8: 权限不足时显示提示信息

## 代码质量

- [ ] Checklist 9: 常量定义文件完整，包含所有 10 个服务的配置
- [ ] Checklist 10: Store 切片文件完整，状态管理逻辑正确
- [ ] Checklist 11: 服务组件实现完整，样式与现有组件一致
- [ ] Checklist 12: SkillList 组件更新正确，无编译错误
- [ ] Checklist 13: 技能商店内容组件更新正确，无编译错误
- [ ] Checklist 14: 后端路由实现完整，API 接口正常
- [ ] Checklist 15: 国际化翻译完整，中英文均有翻译

## 兼容性验证

- [ ] Checklist 16: 现有权限系统正常工作
- [ ] Checklist 17: 现有 MCP 功能不受影响
- [ ] Checklist 18: 现有 Composio 数据向后兼容（不删除已有数据）

## 用户体验

- [ ] Checklist 19: 页面加载时间不超过 2 秒
- [ ] Checklist 20: 连接流程响应时间不超过 3 秒
- [ ] Checklist 21: 错误提示清晰友好
- [ ] Checklist 22: 连接状态显示直观
