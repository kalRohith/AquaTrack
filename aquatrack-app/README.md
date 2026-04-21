# AquaTrack Mobile (Expo)

React Native iPhone app for AquaTrack dehydration monitoring.  
The app calls your FastAPI model endpoints:

- `POST /predict` (main biomarker model)
- `POST /predict-context` (context model)

## Features

- First-launch onboarding carousel
- Home dashboard with animated risk gauge and mini trend sparkline
- Manual input form with grouped biomarker/context fields
- Quick Log mode (long-press "Check Now")
- Results screen with fusion score (`0.6 * main + 0.4 * context`)
- Save history, timeline view, 7-reading trend, CSV export
- Insights (best hydration time, activity impact, low-risk streak, adaptive tips)
- Settings for profile, backend URL, Face ID lock, units, metadata sync
- Offline fallback to cached last reading when backend is unreachable
- Share report card (PNG via iOS share sheet)

## App Structure

```
aquatrack-app/
  app/
    constants/
    components/
    screens/
    services/
    store/
    utils/
```

## Setup

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on iPhone.

## Backend URL

Default URL: `http://localhost:8000`  
Change it in **Settings** when testing on device or remote backend.

## Notes

- API calls use 10s timeout and retry once.
- Missing input values are sent as `null` so backend median-fill logic can apply.
- For best local dev stability, use Node `>=20.19.4`.
