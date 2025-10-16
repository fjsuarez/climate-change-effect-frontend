# Climate Change Effect - Frontend
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



Interactive visualization dashboard for climate change data across European regions.## Getting Started



## FeaturesFirst, run the development server:



- **Interactive Map**: Choropleth map visualization of climate metrics by region```bash

- **Responsive Design**: Optimized layouts for desktop, tablet, and mobile devicesnpm run dev

- **Time Animation**: Animate through weeks and years to see climate change progression# or

- **Detailed Analysis**: Click regions to view:yarn dev

  - Time series charts (single or dual metrics)# or

  - Scatter plots for metric correlationpnpm dev

  - Statistical summaries# or

bun dev

## Technology Stack```



- **Framework**: Next.js 15 with App Router and TurbopackOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- **Language**: TypeScript

- **Styling**: Tailwind CSS + shadcn/ui componentsYou can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

- **Mapping**: Mapbox GL JS via react-map-gl

- **Charts**: RechartsThis project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

- **State Management**: Zustand

- **Data Fetching**: TanStack Query (React Query)## Learn More

- **Gestures**: @use-gesture/react

- **Animations**: Framer MotionTo learn more about Next.js, take a look at the following resources:



## Getting Started- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

### Prerequisites

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

- Node.js 18+ 

- npm or yarn## Deploy on Vercel

- Mapbox account (for map tiles)

- Backend API running on `http://localhost:8000`The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.



### InstallationCheck out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

Get a Mapbox token from: https://account.mapbox.com/access-tokens/

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main page
│   ├── providers.tsx       # React Query provider
│   └── globals.css         # Global styles
├── components/
│   ├── Map/
│   │   ├── ClimateMap.tsx       # Main map component
│   │   └── MapControls.tsx      # Metric/year/week selectors
│   ├── Charts/
│   │   ├── TimeSeriesChart.tsx  # Line charts for time series
│   │   └── ScatterPlot.tsx      # Scatter plots for correlation
│   ├── Modal/
│   │   └── RegionDetailModal.tsx # Responsive detail view
│   └── ui/                      # shadcn components
├── hooks/
│   ├── useClimateData.ts   # React Query hooks for API
│   └── useMediaQuery.ts    # Responsive breakpoint hooks
└── lib/
    ├── api.ts              # API client
    ├── store.ts            # Zustand store
    ├── types.ts            # TypeScript types
    └── utils.ts            # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Responsive Breakpoints

- **Mobile**: < 768px - Bottom sheet modal
- **Tablet**: 768px - 1023px - Slide-out drawer
- **Desktop**: ≥ 1024px - Split panel layout

## API Integration

The frontend expects the following backend endpoints:

- `GET /api/v1/regions?tolerance=<float>` - Fetch region geometries
- `GET /api/v1/metrics/snapshot?metric=<string>&year=<int>&week=<int>&tolerance=<float>` - Fetch metric snapshot
- `GET /api/v1/timeseries/<nuts_id>?metric1=<string>&metric2=<string>` - Fetch time series
- `GET /health-check` - Health check

## Configuration

### Climate Metrics

Edit `src/lib/types.ts` to modify available climate metrics:

```typescript
export const CLIMATE_METRICS = [
  'tas',      // Temperature
  'tasmax',   // Max temperature
  'tasmin',   // Min temperature
  'pr',       // Precipitation
  'rsds',     // Solar radiation
  'sfcWind',  // Wind speed
  'hurs',     // Humidity
  'ps',       // Pressure
] as const;
```

### Date Range

Modify the date range in `src/lib/types.ts`:

```typescript
export const DATE_RANGE = {
  minYear: 2020,
  maxYear: 2100,
  minWeek: 1,
  maxWeek: 52,
} as const;
```

## Development

### Adding New Components

Use shadcn to add components:

```bash
npx shadcn@latest add <component-name>
```

### Styling

The project uses Tailwind CSS. Customize `tailwind.config.ts` for theme changes.

## Troubleshooting

### Map not loading
- Verify `NEXT_PUBLIC_MAPBOX_TOKEN` is set correctly
- Check browser console for Mapbox errors
- Ensure the token has the necessary permissions

### API connection issues  
- Verify backend is running on `http://localhost:8000`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Enable CORS in the backend

### Build errors
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## License

MIT
