#!/bin/bash

# 自動檢查更新並部署的腳本
# 可以用 cron 定期執行: */5 * * * * /path/to/auto-deploy.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 取得本地和遠端的 commit hash
git fetch origin master --quiet

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/master)

# 如果有更新，執行部署
if [ "$LOCAL" != "$REMOTE" ]; then
    echo "[$(date)] New changes detected, deploying..."
    ./deploy.sh
else
    echo "[$(date)] No changes detected."
fi
