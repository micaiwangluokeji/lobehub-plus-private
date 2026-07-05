# Errors

Command failures and integration errors.

---

## [ERR-20260629-001] FloatMenu 导出缺失

**Logged**: 2026-06-29T23:30:00+08:00
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary
@lobehub/editor@4.18.1 版本中移除了 FloatMenu 组件的导出，导致页面报错 "The requested module does not provide an export named 'FloatMenu'"

### Error
```
SyntaxError: The requested module '/node_modules/.vite/deps/@lobehub_editor_react.js?v=edc5d472' does not provide an export named 'FloatMenu'
```

### Context
- 项目使用 @lobehub/editor ^4.17.1，实际安装 4.18.1
- FloatMenu 在 InputEditor 组件中作为 ReactMathPlugin 的 renderComp 使用
- 4.18.1 版本中数学公式编辑器已内置 MathEditorContainer（基于 Popover），不再需要外部 FloatMenu

### Suggested Fix
移除 FloatMenu 的导入和使用，让数学公式编辑器使用内置的 MathEditorContainer

### Resolution
- **Resolved**: 2026-06-29T23:45:00+08:00
- **Files**: 
  - src/features/ChatInput/InputEditor/index.tsx
  - src/features/ChatInput/InputEditor/index.test.tsx
- **Notes**: 
  - 移除了 FloatMenu 的导入
  - 移除了 ReactMathPlugin 的 renderComp 配置，使用编辑器内置容器
  - 更新了测试文件中的 mock

### Metadata
- Reproducible: yes
- Related Files: 
  - src/features/ChatInput/InputEditor/index.tsx
  - node_modules/@lobehub/editor/es/react.d.ts

---
