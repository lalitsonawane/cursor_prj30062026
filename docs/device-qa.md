# Device QA checklist

Run these checks on **physical iOS and Android devices** (simulators miss camera/frame-processor behavior).

## Setup

1. Start backend: `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
2. Point mobile `.env` at your machine IP (not `localhost` on device): `EXPO_PUBLIC_API_URL=http://<LAN_IP>:8000`
3. Build dev client: `cd mobile && npx expo prebuild && npx expo run:ios` or `run:android`

## Functional checks

- [ ] Camera permission prompt appears once and preview starts full-screen
- [ ] Local boxes appear within ~300 ms while panning (white outlines)
- [ ] Cloud status shows “Enhancing with cloud AI…” every ~3–4 s when enrichment enabled
- [ ] Cloud-enriched labels use blue badges and replace overlapping local labels
- [ ] Tapping a list item highlights the corresponding box
- [ ] Pause/resume stops local updates and cloud polling
- [ ] Cloud toggle off keeps on-device boxes only
- [ ] Airplane mode with cloud off still shows local overlays

## Performance checks

- [ ] No overlapping cloud requests (only one “Enhancing…” at a time)
- [ ] App remains responsive during cloud scans
- [ ] Box alignment stays stable when rotating portrait/landscape

## Backend checks

- [ ] `GET /health` returns `mock_mode: true` locally, `false` on GPU deploy
- [ ] `POST /v1/scan` rejects missing API key with 401
- [ ] Oversized uploads return 413
