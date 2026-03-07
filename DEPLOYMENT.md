# 部署指南

## 本地開發

### 1. 設置環境變量

複製 `.env.example` 到 `.env` 並填入 API 密鑰：

```bash
cp .env.example .env
```

編輯 `.env` 文件：

```env
BIGMODEL_API_KEY=your_actual_key_here
CANTONESE_API_KEY=your_actual_key_here
DATABASE_URL=file:./dev.db
```

### 2. 安裝依賴

```bash
bun install
```

### 3. 初始化資料庫

```bash
bun run db:generate
bun run db:push
```

### 4. 運行開發服務器

```bash
bun run dev
```

訪問 http://localhost:3000

## Vercel 部署

### 1. 安裝 Vercel CLI

```bash
bun install -g vercel
```

### 2. 登錄並部署

```bash
vercel login
vercel
```

### 3. 設置環境變量

在 Vercel Dashboard 中添加以下環境變量：

- `BIGMODEL_API_KEY`
- `CANTONESE_API_KEY`
- `DATABASE_URL` (Vercel Postgres 或 SQLite)

### 4. 自動化設置

項目已配置 Vercel Cron，每小時自動生成電台節目：

```json
{
  "crons": [
    {
      "path": "/api/radio?auto=1",
      "schedule": "0 * * * *"
    }
  ]
}
```

## GitHub Actions 部署

### 1. 設置 GitHub Secrets

在 GitHub Repository 設置中添加以下 Secrets：

Settings → Secrets and variables → Actions → New repository secret

- `BIGMODEL_API_KEY`: 你的 BigModel API 密鑰
- `CANTONESE_API_KEY`: 你的 Cantonese.ai API 密鑰

### 2. 手動觸發工作流

在 Actions 頁面選擇 "Radio Automation"，點擊 "Run workflow"：

- 選擇時段 (0-23)，或留空自動生成當前時段
- 點擊 "Run workflow" 按鈕

### 3. 自動定時執行

GitHub Actions 已設置為每小時自動執行一次（與 Vercel Cron 冗餘備份）

## Python 腳本運行

### 安裝 Python 依賴

```bash
pip install -r requirements.txt
```

### 運行腳本

```bash
# 當前時段自動生成
python main.py

# 或指定時段（需要修改腳本）
```

輸出文件會保存在 `broadcasts/` 目錄：

- `broadcast_XX.wav` - 音頻文件
- `script_XX.txt` - 腳本文本
- `metadata_XX.json` - 元數據

## 故障排除

### TypeScript 構建錯誤

如果遇到 TypeScript 錯誤，運行：

```bash
bun run lint
```

修復報告的錯誤後重新構建。

### 資料庫問題

重置資料庫：

```bash
bun run db:reset
```

### API 連接失敗

檢查環境變量是否正確設置：

```bash
echo $BIGMODEL_API_KEY
echo $CANTONESE_API_KEY
```

### 音頻合成失敗

1. 檢查 API 密鑰是否有效
2. 檢查 Cantonese.ai API 配額
3. 查看日誌輸出了解詳細錯誤

## 監控與日誌

### Vercel 日誌

在 Vercel Dashboard 查看實時日誌和錯誤報告。

### GitHub Actions 日誌

在 Actions 頁面查看每次執行的詳細日誌。

### 本地日誌

```bash
# 開發服務器日誌
bun run dev 2>&1 | tee dev.log

# 生產服務器日誌
bun start 2>&1 | tee server.log
```

## 性能優化

### 1. 啟用音頻增強和快速模式

已在 `/api/tts` 和 `/api/radio` 中默認啟用：

```json
{
  "should_enhance": true,
  "should_use_turbo_model": true
}
```

### 2. 調整參數

根據需要調整音頻參數：

- `speed`: 0.5 - 3.0 (1.0 = 正常速度)
- `pitch`: -12 - 12 (0 = 正常音調)

### 3. 快取策略

Vercel 自動快取靜態資源和 API 響應。

## 安全建議

1. **永遠不要**提交 `.env` 文件到 Git
2. 在生產環境使用強密碼和長 API 密鑰
3. 定期輪換 API 密鑰
4. 監控 API 使用情況和配額
5. 限制 API 訪問速率

## 聯繫支持

如遇到問題，請查看：

- [Next.js 文檔](https://nextjs.org/docs)
- [Vercel 文檔](https://vercel.com/docs)
- [Cantonese.ai API 文檔](https://cantonese.ai/docs)
- [BigModel API 文檔](https://open.bigmodel.cn/)
