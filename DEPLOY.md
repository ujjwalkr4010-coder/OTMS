# 🚀 OTMS — Complete Deployment Guide (Render)

## Prerequisites
- GitHub account
- Render account (render.com — free tier works)
- Supabase project with schema already run

---

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "OTMS complete build"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/otms.git
git push -u origin main
```

---

## Step 2: Deploy Backend on Render

1. Go to **[render.com](https://render.com)** → **New +** → **Web Service**
2. Connect your GitHub repo
3. Configure:

| Setting | Value |
|---------|-------|
| Name | `otms-backend` |
| Root Directory | `backend` |
| Environment | `Node` |
| Build Command | `npm install` |
| Start Command | `node server.js` |

4. Add **Environment Variables** (click "Add Environment Variable" for each):

```
NODE_ENV          = production
PORT              = 10000
SUPABASE_URL      = https://your-project.supabase.co
SUPABASE_SERVICE_KEY = eyJhbGci...your-service-role-key
JWT_SECRET        = any_long_random_string_here_min_32_chars
FRONTEND_URL      = https://otms-frontend.onrender.com  ← update after frontend deploys
```

5. Click **Create Web Service**
6. Wait ~3 minutes. Copy the URL: `https://otms-backend.onrender.com`

---

## Step 3: Deploy Frontend on Render

1. **New +** → **Static Site**
2. Connect the same GitHub repo
3. Configure:

| Setting | Value |
|---------|-------|
| Name | `otms-frontend` |
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

4. Add **Environment Variable**:

```
VITE_API_URL = https://otms-backend.onrender.com/api
```

5. Click **Create Static Site**
6. Wait ~2 minutes. Your site is live at `https://otms-frontend.onrender.com`

---

## Step 4: Update Backend CORS

After frontend deploys, go back to your backend service on Render:
- **Environment** → update `FRONTEND_URL` to your actual frontend URL
- Click **Save Changes** → backend will redeploy automatically

---

## Step 5: Set Up Supabase Storage (for file uploads)

1. In Supabase dashboard → **Storage** → **New Bucket**
2. Name: `otms-files`
3. Check **Public bucket** ✅
4. Click **Create bucket**
5. Go to **Storage** → **Policies** → add policy:
   - Policy name: `Allow all`
   - Allowed operations: SELECT, INSERT, UPDATE, DELETE
   - Target roles: `service_role`

---

## Step 6: Verify Everything Works

Test these URLs after deployment:

```
https://otms-backend.onrender.com/api/health
→ Should return: {"status":"OK","message":"OTMS Backend is running"}

https://otms-frontend.onrender.com
→ Should show the OTMS login page
```

---

## ⚠️ Important Notes

### Free Tier Limitations
- Render free tier **spins down** after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- To avoid this, upgrade to Render's paid tier ($7/month) or use a cron job to ping the health endpoint

### Keep Backend Awake (Free Tier Workaround)
Add this to your backend `server.js` to self-ping every 14 minutes:
```js
// Add before app.listen()
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    require('https').get(process.env.RENDER_EXTERNAL_URL + '/api/health', () => {});
  }, 14 * 60 * 1000);
}
```
Then add env var: `RENDER_EXTERNAL_URL = https://otms-backend.onrender.com`

### Custom Domain
1. Render dashboard → your service → **Settings** → **Custom Domains**
2. Add your domain and follow DNS instructions

---

## Environment Variables Summary

### Backend (`backend/.env` for local, Render env vars for production)
```env
PORT=5001                          # 10000 on Render
NODE_ENV=development               # production on Render
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173  # your Render frontend URL in production
```

### Frontend (`frontend/.env` for local, Render env vars for production)
```env
VITE_API_URL=http://localhost:5001/api   # https://otms-backend.onrender.com/api in production
```

---

## Redeployment

Every time you push to GitHub `main` branch, Render will **automatically redeploy** both services.

```bash
git add .
git commit -m "your changes"
git push
```

That's it — Render handles the rest automatically.
