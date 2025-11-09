# AdBoost — Complete Project Package, Automation Scripts & Deployment Guide

Below is the **complete set of project packaging tools**, **GitHub Actions workflow**, and a **Windows setup + deployment guide** to get AdBoost ready for launch.

---

## 1️⃣ Windows Packaging Script — `package_adboost.ps1`

```powershell
# package_adboost.ps1 — Compresses AdBoost project into a zip for deployment
Param([string]$ProjectDir = "$(Resolve-Path .)")

$zipName = "adboost_$(Get-Date -Format yyyyMMdd_HHmm).zip"
$zipPath = Join-Path $ProjectDir $zipName

Write-Host "📦 Packaging AdBoost project from $ProjectDir to $zipPath"

if (Test-Path $zipPath) { Remove-Item $zipPath }
Compress-Archive -Path (Join-Path $ProjectDir '*') -DestinationPath $zipPath -Force

if (Test-Path $zipPath) {
  Write-Host "✅ Package created: $zipPath"
} else {
  Write-Error "❌ Package creation failed"
}
```

Run it from PowerShell:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
./package_adboost.ps1
```
This creates `adboost_YYYYMMDD_HHmm.zip`.

---

## 2️⃣ GitHub Actions Deployment Workflow — `.github/workflows/deploy.yml`

```yaml
name: Deploy AdBoost

on:
  push:
    branches: [ main ]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install backend dependencies
        run: |
          cd backend
          npm ci

      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci

      - name: Build frontend
        run: |
          cd frontend
          npm run build

      - name: Package project
        run: |
          pwsh ./package_adboost.ps1

      - name: Deploy to Render (API)
        run: |
          echo "Trigger Render deploy via webhook"
          curl -X POST -d '{}' ${{ secrets.RENDER_DEPLOY_HOOK_URL }}

      - name: Deploy to Vercel (Frontend)
        run: |
          npm install -g vercel
          vercel --token=${{ secrets.VERCEL_TOKEN }} --prod
```

**Setup:**
1. Create a GitHub repository.
2. In Settings → Secrets → Actions, add:
   - `RENDER_DEPLOY_HOOK_URL` = Render deploy hook URL.
   - `VERCEL_TOKEN` = Vercel personal access token.

---

## 3️⃣ Database Backup Automation (Render Cron Job)

Add this job to `render.yaml`:

```yaml
cron:
  - name: adboost-db-backup
    schedule: '0 2 * * *' # daily at 2AM UTC
    command: 'node scripts/backup-db.js'
    region: oregon
    envVars:
      - key: GOOGLE_SERVICE_ACCOUNT_FILE
        sync: false
      - key: GDRIVE_FOLDER_ID
        sync: false
      - key: DATABASE_URL
        fromDatabase:
          name: adboost-db
          property: connectionString
```

---

## 4️⃣ Local Setup Guide (Windows)

### Step 1: Create folders
```powershell
mkdir C:\Projects\AdBoost
cd C:\Projects\AdBoost
mkdir backend frontend worker scripts .github .github\workflows
```

### Step 2: Copy all canvas files
Copy all provided file contents (backend, frontend, worker, scripts, render.yaml, etc.) into their respective folders.

### Step 3: Install dependencies
```powershell
cd backend
npm install
cd ../frontend
npm install
cd ../worker
npm install
```

### Step 4: Configure environment
Create `.env` files with your actual keys (M-Pesa sandbox, Google Drive, Database URL, etc.).

### Step 5: Initialize database
```powershell
cd backend/src/db
node seed-demo.js
```

### Step 6: Run locally with Docker Compose
```powershell
docker-compose up --build
```
Visit `http://localhost:5173` to test.

### Step 7: Package project
```powershell
cd C:\Projects\AdBoost
pwsh ./package_adboost.ps1
```
Zip file ready for upload.

---

## 5️⃣ Optional — Windows Backup Scheduler
To run backups automatically daily on your PC:
1. Open Task Scheduler → Create Task.
2. Trigger: Daily at your chosen time.
3. Action: Run `powershell.exe` with arguments:
   ```
   -ExecutionPolicy Bypass -File C:\Projects\AdBoost\scripts\backup-db.js
   ```

---

## ✅ Summary
You now have:
- Full AdBoost app structure
- M-Pesa sandbox integration
- Google Drive auto backups
- GitHub Actions CI/CD
- Render daily backup cron job
- Local zip packaging with PowerShell

Would you like me to **combine all files into one single downloadable text block** (each file separated and labeled) so you can paste them into your PC faster?
