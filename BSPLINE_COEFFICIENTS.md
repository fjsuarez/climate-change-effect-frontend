# B-Spline Mortality Curves Visualization

## Overview
This feature adds a new route to visualize **quadratic B-spline curves** that model the temperature-mortality relationship. The curves are constructed using coefficients from `coefs.csv` and temperature distributions from `tmean_distribution.csv`.

### Mathematical Background
- **B-spline Type**: Quadratic (degree 2)
- **Knots**: Placed at the 10th, 75th, and 90th percentiles of each city's temperature distribution
- **Coefficients**: 5 basis function coefficients (b1-b5) per city-age group combination
- **Cities**: 854 different URAU codes
- **Age Groups**: 5 groups (20-44, 45-64, 65-74, 75-84, 85+ years)

## Backend Changes

### New Endpoints in `main.py`

1. **GET `/api/v1/coefficients`**
   - Returns all B-spline coefficients from `data/coefs.csv`
   - Response: Array of 4,270 coefficient records
   
2. **GET `/api/v1/coefficients/cities`**
   - Returns list of 854 unique city codes
   
3. **GET `/api/v1/coefficients/distribution`**
   - Returns temperature distribution percentiles for each city
   - Includes p10, p75, p90 (knot locations) plus min/max
   
4. **GET `/api/v1/bspline/evaluate`** ⭐ **Main Endpoint**
   - **Parameters**: `urau_code`, `agegroup`
   - **Returns**: Evaluated B-spline curve with 100 temperature points
   - **Response format**:
   ```json
   {
     "urau_code": "AT001C",
     "agegroup": "20-44",
     "knots": {
       "p10": -0.67,
       "p75": 17.55,
       "p90": 20.14
     },
     "data": [
       {"temperature": -18.51, "value": 0.8234},
       {"temperature": -17.82, "value": 0.8156},
       ...
     ]
   }
   ```
   
### Dependencies Added
- **scipy**: For B-spline evaluation (`scipy.interpolate.BSpline`)

## Frontend Changes

### New Files

1. **`src/app/coefficients/page.tsx`**
   - New route accessible at `/coefficients`
   - Interactive visualization with three main controls:
     - **City selector**: Choose specific city or view average across all cities
     - **Age group selector**: Filter by age group or view all
     - **Chart type**: Toggle between line chart and bar chart

### Updated Files

1. **`src/lib/api.ts`**
   - Added `BSplineCoefficient` interface
   - Added `getCoefficients()` method
   - Added `getCities()` method

2. **`src/app/page.tsx`**
   - Added navigation button to coefficients page (top-right corner)

## Features

### Interactive Controls
- **City Selector**: Choose from 854 cities (dropdown with URAU codes)
- **Age Group Selector**: Choose from 5 age groups (20-44, 45-64, 65-74, 75-84, 85+ years)
- Real-time curve updates when selection changes

### Visualization
- **Smooth B-spline Curve**: 100 evaluation points for smooth rendering
- **Knot Markers**: Red dashed vertical lines showing knot locations (p10, p75, p90)
- **Axis Labels**: 
  - X-axis: Temperature (°C)
  - Y-axis: Relative Risk
- **Interactive Tooltip**: Hover to see exact temperature and risk values
- **Info Banner**: Displays selected city, age group, and knot temperatures

### B-Spline Computation
The backend evaluates the B-spline using:
1. **Knot Vector**: `[min, min, min, p10, p75, p90, max, max]` (8 knots total)
   - Left boundary repeated 3 times (degree + 1)
   - 3 internal knots at temperature percentiles
   - Right boundary repeated 2 times (degree)
   - Formula: For degree k=2 with n=5 coefficients → need n+k+1 = 8 knots
2. **Basis Functions**: Quadratic B-spline basis (degree 2)
3. **Coefficients**: 5 values (b1-b5) multiply the basis functions
4. **Evaluation**: Uses `scipy.interpolate.BSpline` for numerical stability

## Usage

### Local Development

1. **Start Backend**:
   ```bash
   cd climate-change-effect-backend
   uvicorn main:app --reload
   ```

2. **Start Frontend**:
   ```bash
   cd climate-change-effect-frontend
   npm run dev
   ```

3. **Access the visualization**:
   - Main map: http://localhost:3000
   - Coefficients page: http://localhost:3000/coefficients
   - Or click "View B-Spline Coefficients →" button on the main page

### Production Deployment

The new endpoints will be automatically deployed when you push to your repository:
- Backend: Railway will rebuild with the new endpoints
- Frontend: Vercel will rebuild with the new route

Make sure to redeploy both services after pushing the changes.

## Data Statistics

- **Total rows**: 4,270
- **Unique cities**: 854
- **Age groups**: 5 (20-44, 45-64, 65-74, 75-84, 85+)
- **Coefficients per entry**: 5 (b1-b5)

## Technical Details

### Backend
- **B-Spline Evaluation**: Uses `scipy.interpolate.BSpline`
- **Knot Construction**: Automatic from temperature distribution percentiles
- **Caching**: Reads CSV files on each request (could be optimized with in-memory cache)
- **Error Handling**: Validates city/age group existence before evaluation

### Frontend
- **TanStack Query**: Efficient data fetching with automatic caching
- **Recharts**: Professional chart rendering with `LineChart` and `ReferenceLine`
- **Responsive Design**: Tailwind CSS for mobile-friendly layout
- **Real-time Updates**: Automatic re-fetch when city or age group changes
- **Default Selection**: First city automatically selected on page load

### Mathematical Implementation
The B-spline evaluation follows standard numerical methods:
```python
# Knot vector for degree 2 B-spline with 3 internal knots
# Total: 8 knots for 5 coefficients (n + k + 1 = 5 + 2 + 1)
knots = [min, min, min, p10, p75, p90, max, max]

# Create B-spline with 5 coefficients
bspline = BSpline(knots, [b1, b2, b3, b4, b5], degree=2)

# Evaluate at 100 points between min and max temperature
temperatures = linspace(min, max, 100)
relative_risk = bspline(temperatures)
```

Example output for Vienna (AT001C), age 20-44:
- Temperature range: -18.51°C to 30.36°C
- Minimum mortality risk: 0.23 at -3.2°C (comfortable cold)
- Maximum mortality risk: 1.87 at 30.36°C (extreme heat)
- The curve shows a U-shape with lowest risk around 0-5°C

## Future Enhancements

Potential improvements:
1. **Multi-curve Comparison**: Overlay curves for different age groups
2. **City Search**: Autocomplete search for easier city finding
3. **Export**: Download curve data as CSV or chart as PNG
4. **Statistical Info**: Show minimum mortality temperature, heat/cold thresholds
5. **Map Integration**: Click a region on the main map to jump to its B-spline curve
6. **Uncertainty Bands**: Add confidence intervals if available
7. **Animation**: Animate through all age groups for a city
8. **Performance**: Cache temperature distributions in backend memory
