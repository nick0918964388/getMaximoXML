---
name: auto-commit-after-tests
enabled: true
event: bash
pattern: npm\s+test|vitest|jest|npm\s+run\s+test
action: warn
---

## 測試完成提醒

測試命令剛剛執行完畢。請檢查以下事項：

### 如果測試通過：

1. **檢查是否有未提交的變更：**
   ```bash
   git status
   ```

2. **如果有變更需要提交：**
   - 使用 `git add <specific files>` 暫存相關檔案
   - 根據變更內容生成描述性的 commit message
   - 執行 `git commit -m "<message>"`
   - 執行 `git push` 推送到遠端

3. **詢問使用者是否要 commit and push**

### 如果測試失敗：
- 先修復測試問題
- 不要提交失敗的程式碼

---
**這是使用者的要求**：測試通過後，主動詢問是否要 commit and push。
