# Frontend Deployment Guide - Vercel

## Prerequisites
- GitHub repository: https://github.com/fjsuarez/climate-change-effect-frontend
- Railway backend URL (from previous deployment)
- Mapbox token

## Step-by-Step Deployment

### 1. Go to Vercel
- Visit [vercel.com](https://vercel.com)
- Sign in with your GitHub account

### 2. Import Your Project
- Click **"Add New..."** → **"Project"**
- Find and select **`climate-change-effect-frontend`** repository
- Click **"Import"**

### 3. Configure Project Settings
Vercel will auto-detect Next.js. Keep these default settings:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave as is)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)

### 4. Add Environment Variables (CRITICAL!)
Click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | Your Railway backend URL (e.g., `https://climate-change-effect-backend-production.up.railway.app`) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Your Mapbox access token |

**Important**: 
- Don't include trailing slashes in the API URL
- The Railway URL should start with `https://`

### 5. Deploy
- Click **"Deploy"**
- Wait 2-3 minutes for the build to complete
- You'll get a URL like: `https://climate-change-effect-frontend.vercel.app`

### 6. Update Backend CORS (After Deployment)
Go back to Railway and add this environment variable:
- **Name**: `ALLOWED_ORIGINS`
- **Value**: `https://your-vercel-app.vercel.app,https://dashboard.climateinsure.tech,http://localhost:3000`

Replace `your-vercel-app` with your actual Vercel URL.

## Testing Your Deployment
Once deployed, visit your Vercel URL and check:
1. ✅ Map loads correctly
2. ✅ Regions are visible
3. ✅ Can select metrics and see data
4. ✅ Animation works
5. ✅ Legend displays properly
6. ✅ Click on regions to see details

## Troubleshooting

### CORS Errors
- Make sure you added your Vercel URL to `ALLOWED_ORIGINS` in Railway
- Railway needs to be redeployed after adding the variable

### Map Not Loading
- Check that `NEXT_PUBLIC_MAPBOX_TOKEN` is set correctly in Vercel
- Verify the token is valid at https://account.mapbox.com/access-tokens/

### No Data Showing
- Verify `NEXT_PUBLIC_API_URL` points to your Railway backend
- Test the backend directly: `https://your-railway-url.up.railway.app/health-check`

### Build Fails
- Check the build logs in Vercel dashboard
- Common issue: Missing environment variables

## Automatic Deployments
Every time you push to the `main` branch, Vercel will automatically:
- Build and deploy your changes
- Give you a preview URL
- Update your production URL if build succeeds

## Custom Domain (Optional)
In Vercel dashboard:
1. Go to your project → **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

---

Your frontend is now ready to deploy! 🚀
