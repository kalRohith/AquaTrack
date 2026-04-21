# AquaTrack

AquaTrack includes:

- Python notebooks and helper modules for dehydration model training
- FastAPI backend endpoints (served separately) for model inference
- Expo React Native iPhone client in `aquatrack-app/`

## Repository Layout

- `notebooks/` - EDA, preprocessing, modeling workflows
- `models/` - helper modules and serialized artifacts
- `aquatrack-app/` - mobile app (Expo)

## Mobile App

Run the iPhone app from:

```bash
cd aquatrack-app
npm install
npx expo start
```

Open Expo Go on iPhone and scan the QR code.

## API Endpoints Used by Mobile

- `POST /predict`
- `POST /predict-context`
- optional `GET /about`
