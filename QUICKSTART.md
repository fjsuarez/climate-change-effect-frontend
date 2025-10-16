# Quick Start Guide

## 🚀 Frontend Setup Complete!

Your Next.js climate change visualization app is ready to run.

## Next Steps

### 1. Get a Mapbox Token

1. Go to https://account.mapbox.com/
2. Sign up or log in
3. Navigate to "Access Tokens"
4. Create a new token or copy your default public token
5. Copy the token (starts with `pk.`)

### 2. Configure Environment Variables

Edit the `.env.local` file and add your Mapbox token:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_actual_token_here
```

### 3. Start the Backend

In a separate terminal, navigate to the backend directory and start it:

```bash
cd /home/fjsuarez/climate-change-effect/climate-change-effect-backend
# Activate your Python environment if needed
python main.py
```

Make sure the backend is running on `http://localhost:8000`

### 4. Start the Frontend

```bash
cd /home/fjsuarez/climate-change-effect/climate-change-effect-frontend
npm run dev
```

The app will be available at: http://localhost:3000

## 📱 What You'll See

### Desktop View
- **Left side**: Interactive map with climate data overlay
- **Right side**: Control panel for selecting metrics, year, and week
- **Click a region**: Opens a slide-in panel with detailed charts

### Mobile View
- **Full screen map** with floating controls at the top
- **Tap a region**: Opens a bottom sheet with charts
- **Swipe up/down** to expand/collapse the bottom sheet

## 🎯 Features to Try

1. **Select different metrics** from the dropdown (tas, tasmax, pr, etc.)
2. **Use the year/week sliders** to see how data changes over time
3. **Click the "Play Animation"** button to watch time progression
4. **Click any region** to see detailed time series and scatter plots
5. **Select a second metric** in the modal to view correlations

## 🎨 Customization

### Change Available Metrics
Edit: `src/lib/types.ts` → `CLIMATE_METRICS` array

### Adjust Date Ranges
Edit: `src/lib/types.ts` → `DATE_RANGE` object

### Modify Map Style
Edit: `src/components/Map/ClimateMap.tsx` → change `mapStyle` prop

### Update Color Scale
Edit: `src/components/Map/ClimateMap.tsx` → modify the `fill-color` interpolation in `dataLayer`

## 🐛 Troubleshooting

**Map shows "Mapbox token not configured"**
→ Add your token to `.env.local` and restart the dev server

**"Failed to fetch regions" error**
→ Make sure the backend is running on port 8000

**TypeScript errors in editor**
→ The project may need to rebuild after first install. Try stopping and restarting the dev server.

**Blank map**
→ Check browser console for errors. Verify the backend has data loaded.

## 📦 Project Structure

```
climate-change-effect-frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Main page (map + controls)
│   │   └── providers.tsx       # React Query setup
│   ├── components/
│   │   ├── Map/
│   │   │   ├── ClimateMap.tsx       # Main map with choropleth
│   │   │   └── MapControls.tsx      # Metric/date selectors
│   │   ├── Charts/
│   │   │   ├── TimeSeriesChart.tsx  # Line charts
│   │   │   └── ScatterPlot.tsx      # Correlation plots
│   │   └── Modal/
│   │       └── RegionDetailModal.tsx # Detail view
│   ├── hooks/
│   │   ├── useClimateData.ts   # API data hooks
│   │   └── useMediaQuery.ts    # Responsive hooks
│   └── lib/
│       ├── api.ts              # Backend API client
│       ├── store.ts            # Global state (Zustand)
│       └── types.ts            # TypeScript definitions
├── .env.local                   # Environment config
└── README.md                    # Full documentation
```

## 🎉 You're All Set!

Open http://localhost:3000 and start exploring climate data!
