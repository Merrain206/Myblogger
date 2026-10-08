#!/usr/bin/env python3
"""检查目标图片名是否已存在于 public/images/blog/，避免覆盖既有资源。

用法:
    python check_assets.py <name1> [<name2> ...]   # 查重（可带或不带扩展名）
    python check_assets.py --all                    # 列出全部现有资源
    python check_assets.py --list <关键词>          # 按关键词筛选现有资源

退出码:
    0 = 待用名全部可用（无冲突）
    1 = 至少一个待用名已存在（冲突），或参数错误
"""

from __future__ import annotations

import sys
from pathlib import Path

# Windows 控制台默认 GBK，会与 UTF-8 终端不一致导致中文乱码；强制 UTF-8 输出。
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")

# 从脚本位置回推仓库根：<repo>/.claude/skills/blog-illustrator/scripts/ → <repo>
REPO_ROOT = Path(__file__).resolve().parents[4]
ASSETS_DIR = REPO_ROOT / "public" / "images" / "blog"


def existing() -> list[str]:
    if not ASSETS_DIR.is_dir():
        return []
    return sorted(p.name for p in ASSETS_DIR.iterdir() if p.is_file())


def main(argv: list[str]) -> int:
    if not ASSETS_DIR.is_dir():
        print(f"[错误] 未找到图片目录: {ASSETS_DIR}", file=sys.stderr)
        return 1

    if not argv:
        print(__doc__.strip())
        return 1

    if argv[0] == "--all":
        names = existing()
        print(f"图片目录: {ASSETS_DIR}")
        print(f"共 {len(names)} 个文件:")
        for n in names:
            print(f"  {n}")
        return 0

    if argv[0] == "--list":
        if len(argv) < 2:
            print("[错误] --list 需要一个关键词", file=sys.stderr)
            return 1
        kw = argv[1].lower()
        hits = [n for n in existing() if kw in n.lower()]
        print(f"匹配 '{argv[1]}' 的现有资源 ({len(hits)}):")
        for n in hits or ["(无)"]:
            print(f"  {n}")
        return 0

    have = {Path(n).stem.lower() for n in existing()}
    conflicts = []
    for raw in argv:
        stem = Path(raw).stem.lower()
        mark = "冲突" if stem in have else "可用"
        if stem in have:
            conflicts.append(raw)
        print(f"  [{mark}] {raw}")

    if conflicts:
        print(f"\n[结果] {len(conflicts)} 个名称已存在，请换名以避免覆盖:", file=sys.stderr)
        for c in conflicts:
            print(f"  - {c}", file=sys.stderr)
        return 1

    print(f"\n[结果] 全部 {len(argv)} 个名称可用。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
