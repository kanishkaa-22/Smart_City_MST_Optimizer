# Deployment Guide - Smart City MST Optimizer

## 🚀 Deploy to Vercel

This guide will help you deploy the Smart City MST Optimizer to Vercel in minutes.

### Prerequisites
- GitHub account with the repository pushed (✓ Already done!)
- Vercel account (https://vercel.com)

### Step-by-Step Deployment

#### Step 1: Connect GitHub to Vercel
1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select "Import Git Repository"
4. Enter: `https://github.com/kanishkaa-22/Smart_City_MST_Optimizer`
5. Click "Continue"

#### Step 2: Configure Project
- **Project Name**: `smart-city-mst-optimizer` (or your preference)
- **Framework**: Select "Other"
- **Root Directory**: Leave as default (.)
- **Build Command**: Leave empty (no build needed)
- **Output Directory**: Leave empty
- **Install Command**: `npm install`
- **Development Command**: Leave empty

#### Step 3: Deploy
1. Click "Deploy"
2. Wait for the deployment to complete (usually 1-2 minutes)
3. You'll get a URL like: `https://smart-city-mst-optimizer.vercel.app`

#### Step 4: Access Your App
- **Frontend**: `https://smart-city-mst-optimizer.vercel.app`
- **API**: `https://smart-city-mst-optimizer.vercel.app/api/health`
- **Presets**: `https://smart-city-mst-optimizer.vercel.app/api/presets`

---

## 🔗 Key Endpoints (After Deployment)

Once deployed, use these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Frontend application |
| `/api/health` | GET | Health check |
| `/api/presets` | GET | List all presets |
| `/api/presets/:key` | GET | Get specific preset (small/medium/large) |
| `/api/validate` | POST | Validate graph |
| `/api/stats` | POST | Get graph statistics |
| `/api/mst/kruskal` | POST | Run Kruskal's algorithm |
| `/api/mst/prim` | POST | Run Prim's algorithm |
| `/api/mst/compare` | POST | Compare both algorithms |

---

## 📝 Sample API Calls

### Health Check
```bash
curl https://smart-city-mst-optimizer.vercel.app/api/health
```

### Get Presets
```bash
curl https://smart-city-mst-optimizer.vercel.app/api/presets
```

### Get Small City Preset
```bash
curl https://smart-city-mst-optimizer.vercel.app/api/presets/small
```

### Run Kruskal's Algorithm
```bash
curl -X POST https://smart-city-mst-optimizer.vercel.app/api/mst/kruskal \
  -H "Content-Type: application/json" \
  -d '{
    "nodes": [{"id":0,"label":"A"},{"id":1,"label":"B"}],
    "edges": [{"id":0,"n1":0,"n2":1,"weight":5}]
  }'
```

---

## 🐛 Troubleshooting

### App shows 404 error
- Wait 2-3 minutes for deployment to complete
- Check Vercel dashboard for build errors
- Clear browser cache (Ctrl+Shift+Delete)

### API not responding
- Check that the endpoint URL includes `/api/` prefix
- Verify your JSON payload in POST requests
- Check Vercel logs: Project Settings → Deployments → View Logs

### Changes not reflecting
- Push changes to GitHub
- Vercel auto-deploys on push
- Wait 1-2 minutes for deployment
- Check deployment status in Vercel dashboard

---

## 📊 Monitoring

View your deployment stats:
1. Go to https://vercel.com/dashboard
2. Select your project
3. View real-time analytics and logs

---

## 🔐 Environment Variables (Optional)

If you need to add environment variables:
1. Go to Vercel Dashboard
2. Project → Settings → Environment Variables
3. Add any custom variables needed

---

## 📞 Support

For Vercel issues: https://vercel.com/support
For project issues: Check GitHub repository

---

**✨ Your Smart City MST Optimizer is now deployed and accessible worldwide!**

Generated: May 5, 2026
