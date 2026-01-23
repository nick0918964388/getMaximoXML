#!/bin/bash

# 設定顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 取得腳本所在目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}[Deploy] Starting deployment...${NC}"

# 拉取最新代碼
echo -e "${YELLOW}[Deploy] Pulling latest changes...${NC}"
git pull origin master

if [ $? -ne 0 ]; then
    echo -e "${RED}[Deploy] Git pull failed!${NC}"
    exit 1
fi

# 進入 web 目錄
cd web

# 建立 logs 目錄
mkdir -p logs

# 安裝依賴
echo -e "${YELLOW}[Deploy] Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}[Deploy] npm install failed!${NC}"
    exit 1
fi

# 建置專案
echo -e "${YELLOW}[Deploy] Building project...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}[Deploy] Build failed!${NC}"
    exit 1
fi

# 回到根目錄
cd "$SCRIPT_DIR"

# 重啟 PM2 應用
echo -e "${YELLOW}[Deploy] Restarting PM2 application...${NC}"

# 檢查應用是否已存在
if pm2 list | grep -q "maximo-xml-generator"; then
    pm2 restart ecosystem.config.cjs
else
    pm2 start ecosystem.config.cjs
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}[Deploy] PM2 restart failed!${NC}"
    exit 1
fi

# 保存 PM2 進程列表
pm2 save

echo -e "${GREEN}[Deploy] Deployment completed successfully!${NC}"
echo -e "${GREEN}[Deploy] Application is running at http://localhost:3002${NC}"

# 顯示應用狀態
pm2 status
