# Git 历史与个人信息清理手册

当前提交树已停止跟踪 `Tickets/pdfs/*.pdf`，并通过 `.gitignore` 阻止票据、OCR 导出、私有 JSON、数据库、备份和环境文件再次加入。历史提交仍可能包含票据个人信息以及旧认证凭据，因此必须把它们视为已经泄露。

以下操作会重写历史，本文只供人工执行。本次修复没有运行 `git filter-repo`、BFG 或强制推送。

## 操作顺序

1. 立即把远程仓库改为私有，暂停新的 clone、fork 和 release。
2. 创建离线镜像备份，并记录所有分支、标签和协作者。
3. 先轮换生产认证密码、签名密钥和可能受影响的第三方 API Key；历史清理不能代替密钥轮换。
4. 在新的镜像克隆中安装并运行 `git filter-repo`：

```bash
git filter-repo --path-glob 'Tickets/pdfs/*.pdf' --invert-paths
```

5. 对历史中的旧密码、HMAC/JWT 密钥、API Key、Cookie 或 token，使用只保存在本机且不会提交的 replace-text 文件再次清理；文件中不要包含无关数据。
6. 用路径级扫描和秘密扫描器检查所有分支、标签，不在报告中打印命中的值或个人信息。
7. 通知协作者删除旧 clone，并在约定窗口强制推送全部分支和标签。
8. 人工处理 GitHub/GitLab fork、PR 引用、release asset、Actions artifact、包缓存和搜索引擎/CDN 缓存；必要时联系托管平台支持。
9. 重新开放仓库前，确认旧对象无法从远程引用访问，并再次轮换高风险密钥。

不要在现有工作副本上直接尝试历史重写。任何强制推送都需要单独审批和协作者协调。
