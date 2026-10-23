# Git 历史与个人信息清理记录

2026-10-23 已在独立镜像中完成历史改写，并强制更新 GitHub `main`。仓库仍保持私有；在 GitHub Support 完成服务端对象清除前，不得改为公开。

## 已完成

- 建立改写前镜像和 Git bundle 临时备份，并验证备份完整性。
- 从历史中删除 `Tickets/pdfs/` 下的 19 份票据 PDF 和旧 `src/data/gomoku-scores.json`。
- 从历史中删除当前版本早已不再使用的 52.12 MiB PPTX；历史中已无大于等于 5 MiB 的 blob。
- 在全部历史中替换旧固定密码和固定 HMAC 密钥；原值未写入报告或仓库。
- 清除改写镜像中的原始 refs、reflog 和不可达对象，仅推送 `main`；仓库没有其他分支、标签、Release、Actions artifact、PR 或 fork。
- 改写后的 tip tree 与改写前一致，说明当前源码内容未被历史清理误改。
- 从 GitHub 全新克隆验证：Gitleaks 0 命中、Git 对象完整性检查通过。
- 本地工作副本已对齐新历史；改写前的未提交文件保持未提交状态。

## 尚未完成：GitHub 服务端清除

强制推送后，旧提交已不在任何分支或标签中，但实测 GitHub 仍能按旧 SHA 返回不可达对象。GitHub 官方文档说明，强制推送不会立即清除按 SHA 缓存的视图和服务端对象；需要通过 GitHub Support 请求垃圾回收和缓存清除。

Support 工单需提供：

1. 仓库：`Merrain206/Myblogger`。
2. 受影响 PR 数：`0`。
3. 本次清理的 First Changed Commit；只在私密工单中提供，不写入仓库。
4. 清理范围：票据 PDF、私有比分 JSON、旧固定密码、旧固定 HMAC 密钥和旧的大型 PPTX。
5. 无 fork、无标签、无 Release、无 Actions artifact、无 PR 引用、无已知孤立 LFS 对象。
6. 请求 Support 删除缓存视图，并对不可达 Git 对象执行服务端垃圾回收。

Support 回复清理完成后，必须再次验证旧 SHA 无法 fetch；在此之前不要公开仓库。

## 协作者与公开前检查

- 所有持有旧 clone 的协作者应删除并重新 clone；不要把旧分支 merge 回新 `main`。
- 确认 DeepSeek 等第三方 API Key 已轮换，且一次性管理员密码文件已安全删除。
- 再跑 Gitleaks、测试、类型检查和生产构建。
- 检查新分支、标签、PR、Release、Actions artifact 和 fork，确保没有重新引用旧历史。
- 仅当旧 SHA 无法访问且上述检查全部通过后，才能把 GitHub visibility 改为 public。
