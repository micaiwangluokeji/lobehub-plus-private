---
name: fix-private-repo-push-credentials
overview: 修复 GitHub Actions workflow 中私有仓库推送失败的 403 错误 - 改用 credential.helper store 方式覆盖 checkout 的默认 GITHUB_TOKEN
todos:
  - id: update-workflow
    content: 修改 sync-canary-to-gitee.yml 中私有仓库推送步骤，添加 credential.helper store 凭证模式
    status: completed
  - id: push-to-canary
    content: 提交修改并推送到 GitHub canary 分支
    status: completed
    dependencies:
      - update-workflow
  - id: test-verify
    content: 触发 workflow 运行，验证私有仓库推送是否成功
    status: completed
    dependencies:
      - push-to-canary
---

修复 GitHub Actions workflow 中 "Push to private GitHub repo canary" 步骤的 403 权限错误。

## 问题根因

- `actions/checkout@v6` 设置了全局 credential.helper 并存储了 GITHUB_TOKEN（对应 github-actions[bot] 用户）
- 该 Token 对 micaiwangluokeji/lobehub-plus-private 仓库无访问权限
- URL 内嵌 Token 方式（https://piepiepie:${GH_PAT}@github.com/...）被 credential helper 覆盖

## 解决方案

给私有仓库推送步骤添加 credential.helper store 模式（与 Gitee 步骤相同的方式），用 GH_PRIVATE_REPO_PAT 覆盖 checkout 设置的 GITHUB_TOKEN 凭证。

## 修改文件

`.github/workflows/sync-canary-to-gitee.yml` -- 修改 "Push to private GitHub repo canary" 步骤

## 具体变更

当前内容：

```
      - name: Push to private GitHub repo canary
        env:
          GH_PAT: ${{ secrets.GH_PRIVATE_REPO_PAT }}
        run: |
          # 使用 URL 内嵌 Token 方式推送私有仓库...
          git remote rm private_repo 2>/dev/null || true
          git remote add private_repo https://piepiepie:${GH_PAT}@github.com/micaiwangluokeji/lobehub-plus-private.git
          git push -f private_repo canary
```

修改为：

```
      - name: Push to private GitHub repo canary
        env:
          GH_PAT: ${{ secrets.GH_PRIVATE_REPO_PAT }}
        run: |
          git config --global credential.helper store
          echo "https://piepiepie:${GH_PAT}@github.com" > ~/.git-credentials

          git remote rm private_repo 2>/dev/null || true
          git remote add private_repo https://github.com/micaiwangluokeji/lobehub-plus-private.git
          git push -f private_repo canary

          rm -f ~/.git-credentials
          git config --global --unset credential.helper || true
```

## 实施注意事项

1. 当前分支是 merge/canary-into-main，需先切换到 canary 分支再修改
2. 修改后 push 到 GitHub canary 分支：git push github HEAD:canary
3. Gitee 推送步骤已正常，不做任何修改
4. 待用户确认计划后再执行修改
