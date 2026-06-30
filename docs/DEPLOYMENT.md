# Surroundings Scanner — Deployment Guide

Complete reference for deploying the hybrid live scanner: **GPU backend** (LocateAnything-3B) + **Expo mobile app** (iOS/Android).

---

## Table of contents

1. [Architecture recap](#architecture-recap)
2. [Prerequisites](#prerequisites)
3. [Fastest path: local dev in 15 minutes](#fastest-path-local-dev-in-15-minutes)
4. [Backend deployment](#backend-deployment)
5. [Mobile deployment](#mobile-deployment)
6. [Connect mobile to backend](#connect-mobile-to-backend)
7. [Environment variables](#environment-variables)
8. [Verify everything works](#verify-everything-works)
9. [Production checklist](#production-checklist)
10. [Tips and tricks](#tips-and-tricks)
11. [Troubleshooting](#troubleshooting)
12. [License reminder](#license-reminder)

---

## Architecture recap

```
Phone (Expo + Vision Camera)
  ├─ On-device: instant boxes every ~3 frames (local tier)
  └─ Cloud: JPEG keyframe every ~3.5 s → POST /v1/scan
                    ↓
              FastAPI on GPU server
                    ↓
              LocateAnything-3B inference
```

| Component | Where it runs | Purpose |
|-----------|---------------|---------|
| `mobile/` | iPhone / Android | Live camera, overlays, cloud upload |
| `backend/` | Linux + NVIDIA GPU | Open-vocabulary object grounding |
| Mock mode | Your laptop (no GPU) | UI/API testing without the 3B model |

**Important:** LocateAnything-3B needs a GPU for real inference. The backend defaults to `MOCK_INFERENCE=true` so you can develop without one.

---

## Prerequisites

### For backend (local mock)

- Python 3.11+ (3.14 works for mock mode)
- 2 GB RAM, no GPU

### For backend (production GPU)

- Linux (Ubuntu 22.04 recommended)
- NVIDIA GPU with **≥ 16 GB VRAM** (24 GB+ safer at 1280px)
- CUDA 12.x compatible driver
- Hugging Face account (accept model license for `nvidia/LocateAnything-3B`)
- ~10 GB disk for model weights

### For mobile

- Node.js 20+
- macOS with Xcode (iOS) or Android Studio (Android)
- **Physical device** for camera testing (simulators are limited)
- Apple Developer account (iOS device builds) / Android keystore (Play Store)

### Do not use Expo Go

This app uses **react-native-vision-camera** native modules. You must build a **dev client**:

```bash
npx expo prebuild
npx expo run:ios    # or run:android
```

---

## Fastest path: local dev in 15 minutes

Use this to validate the full stack before spending money on GPU hosting.

### Step 1 — Start backend (mock mode)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install fastapi uvicorn pydantic pydantic-settings python-multipart Pillow numpy httpx pytest
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Confirm:

```bash
curl http://localhost:8000/health
# → {"status":"ok","model_loaded":true,"mock_mode":true,...}
```

### Step 2 — Configure mobile

```bash
cd mobile
cp .env.example .env
```

Edit `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8000
EXPO_PUBLIC_API_KEY=dev-key-change-me
```

Find your LAN IP:

```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'
```

**Tip:** `localhost` only works in the iOS Simulator on the same Mac—not on a physical phone.

### Step 3 — Build and run mobile

```bash
cd mobile
npm install
npx expo prebuild
npx expo run:ios     # or: npx expo run:android
```

Open the app → grant camera permission → you should see live boxes (local) and cloud enrichment every few seconds.

---

## Backend deployment

### Option A — Docker on a GPU VM (recommended)

Best for RunPod, AWS g5, GCP L4, Lambda Labs, etc.

#### 1. Launch a GPU instance

| Provider | Suggested instance | Notes |
|----------|-------------------|-------|
| RunPod | RTX 4090 / A5000 | Easy hourly billing |
| AWS | g5.xlarge (A10G) | Stable, more setup |
| GCP | g2-standard-4 (L4) | Good price/perf |
| Modal | Serverless GPU | Pay per request |

Open inbound port **8000** (or 443 behind a reverse proxy).

#### 2. Clone and configure

```bash
git clone https://github.com/lalitsonawane/cursor_prj30062026.git
cd cursor_prj30062026/backend
cp .env.example .env
```

Production `.env` example:

```env
API_KEY=replace-with-long-random-secret
MOCK_INFERENCE=false
MODEL_PATH=nvidia/LocateAnything-3B
SCENE_LISTER_MODE=taxonomy
MAX_IMAGE_EDGE=1280
GENERATION_MODE=fast
MAX_NEW_TOKENS=2048
CORS_ORIGINS=https://your-app-domain.com,*
```

Generate a strong API key:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### 3. Hugging Face login (first run)

```bash
pip install huggingface_hub
huggingface-cli login
```

Accept the license at: https://huggingface.co/nvidia/LocateAnything-3B

#### 4. Build and run Docker

```bash
cd backend
docker build -t surroundings-scanner-api .
docker run --gpus all -p 8000:8000 \
  --env-file .env \
  -e HF_HOME=/root/.cache/huggingface \
  -v hf_cache:/root/.cache/huggingface \
  surroundings-scanner-api
```

**Tip:** Mount a volume for Hugging Face cache so the model is not re-downloaded on every restart.

First startup may take **5–15 minutes** while weights download (~4B params).

#### 5. Smoke test

```bash
curl http://YOUR_SERVER_IP:8000/health
# mock_mode should be false on GPU

curl -X POST http://YOUR_SERVER_IP:8000/v1/scan \
  -H "X-API-Key: YOUR_API_KEY" \
  -F "file=@test.jpg"
```

---

### Option B — Bare metal on GPU VM (no Docker)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate

# Install CUDA PyTorch first (match your CUDA version)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124

pip install -r requirements.txt
cp .env.example .env
# Edit .env: MOCK_INFERENCE=false, set API_KEY

huggingface-cli login
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
```

**Tip:** Use `--workers 1` only. Each worker loads its own copy of the 3B model and will OOM.

---

### Option C — Keep mock backend for demos

Useful for frontend demos, investor previews, or CI:

```env
MOCK_INFERENCE=true
```

Mock returns plausible bounding boxes without GPU. Set `mock: true` in API responses.

---

### Option D — Better scan quality (OpenAI scene lister)

Default `SCENE_LISTER_MODE=taxonomy` uses fixed category batches (no extra cost).

For smarter “scan everything” prompts:

```env
SCENE_LISTER_MODE=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Trade-off: extra latency + API cost, but better category discovery in cluttered scenes.

---

### HTTPS and reverse proxy (production)

Do not expose raw HTTP to the public internet. Put **nginx** or **Caddy** in front:

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    client_max_body_size 6M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_read_timeout 120s;
    }
}
```

Mobile `.env`:

```env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
```

**Tip:** iOS requires HTTPS for production App Store builds (ATS). Android 9+ also prefers HTTPS.

---

## Mobile deployment

### Development build (daily testing)

```bash
cd mobile
npm install
cp .env.example .env
# Set EXPO_PUBLIC_API_URL and EXPO_PUBLIC_API_KEY

npx expo prebuild          # generates ios/ and android/
npx expo run:ios           # physical device or simulator
npx expo run:android
```

After changing native dependencies (Vision Camera, etc.):

```bash
npx expo prebuild --clean
npx expo run:ios
```

---

### Internal distribution (TestFlight / internal APK)

#### iOS — EAS Build

```bash
npm install -g eas-cli
eas login
cd mobile
eas build:configure
eas build --platform ios --profile preview
```

Add to `eas.json` (create if missing):

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.yourdomain.com",
        "EXPO_PUBLIC_API_KEY": "your-production-key"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.yourdomain.com",
        "EXPO_PUBLIC_API_KEY": "your-production-key"
      }
    }
  }
}
```

Submit to TestFlight:

```bash
eas submit --platform ios
```

#### Android — internal APK

```bash
eas build --platform android --profile preview
```

Download the APK from the EAS dashboard and sideload, or use Play Console internal testing.

---

### App Store / Play Store production

1. Change bundle ID / package name in `mobile/app.json` if needed:
   - iOS: `com.yourcompany.surroundings`
   - Android: same pattern
2. Replace placeholder icons in `mobile/assets/`
3. Set production API URL via EAS secrets (never commit real keys):

```bash
eas secret:create --name EXPO_PUBLIC_API_KEY --value "your-key"
eas secret:create --name EXPO_PUBLIC_API_URL --value "https://api.yourdomain.com"
```

4. Build release:

```bash
eas build --platform all --profile production
```

---

### Swap placeholder on-device detector (production)

Current dev implementation: `mobile/lib/onDeviceDetector.ts` uses lightweight worklet placeholders.

For real COCO detection at 10–15 FPS, integrate **react-native-executorch** (SSD MobileNet or RF-DETR Nano):

1. Install ExecuTorch native module
2. Replace `detectOnDevice()` body with model inference
3. Re-run `npx expo prebuild --clean`

Until then, local boxes are deterministic demos; cloud enrichment carries real labels when backend uses real inference.

---

## Connect mobile to backend

| Scenario | `EXPO_PUBLIC_API_URL` |
|----------|------------------------|
| iOS Simulator on same Mac | `http://localhost:8000` |
| Android Emulator | `http://10.0.2.2:8000` |
| Physical phone, backend on laptop | `http://192.168.x.x:8000` |
| Production | `https://api.yourdomain.com` |

API key must match on both sides:

| Location | Variable |
|----------|----------|
| Backend | `API_KEY` in `backend/.env` |
| Mobile | `EXPO_PUBLIC_API_KEY` in `mobile/.env` |

Mobile sends it as header: `X-API-Key: ...`

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `API_KEY` | `dev-key-change-me` | Required on all scan endpoints |
| `MOCK_INFERENCE` | `true` | `false` for real LocateAnything |
| `MODEL_PATH` | `nvidia/LocateAnything-3B` | HF model id or local path |
| `SCENE_LISTER_MODE` | `taxonomy` | `taxonomy` or `openai` |
| `OPENAI_API_KEY` | — | Required if scene lister is `openai` |
| `OPENAI_MODEL` | `gpt-4o-mini` | Vision-capable model |
| `MAX_IMAGE_EDGE` | `1280` | Downscale uploads (lower = faster) |
| `MAX_IMAGE_BYTES` | `5000000` | Reject larger uploads (413) |
| `GENERATION_MODE` | `fast` | `fast`, `hybrid`, or `slow` |
| `MAX_NEW_TOKENS` | `2048` | Raise to 8192 if boxes truncate |
| `CORS_ORIGINS` | `*` | Comma-separated origins for production |

### Mobile (`mobile/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `EXPO_PUBLIC_API_URL` | `http://localhost:8000` | Backend base URL |
| `EXPO_PUBLIC_API_KEY` | `dev-key-change-me` | Must match backend `API_KEY` |

Timing constants live in `mobile/lib/config.ts` (edit in code):

| Constant | Value | Purpose |
|----------|-------|---------|
| `cloudScanIntervalMs` | 3500 | How often to cloud-scan |
| `minCloudScanIntervalMs` | 3000 | Client rate limit floor |
| `localProcessEveryNthFrame` | 3 | Battery saver for on-device tier |
| `cloudUploadMaxEdge` | 960 | JPEG size before upload |

---

## Verify everything works

### Backend

```bash
# Health
curl https://api.yourdomain.com/health

# Scan with image
curl -X POST https://api.yourdomain.com/v1/scan \
  -H "X-API-Key: YOUR_KEY" \
  -F "file=@photo.jpg" | jq .

# Ground a phrase
curl -X POST https://api.yourdomain.com/v1/ground \
  -H "X-API-Key: YOUR_KEY" \
  -F "file=@photo.jpg" \
  -F "phrase=red coffee mug" | jq .
```

Expected on GPU: `"mock": false`, `"detections": [...]` with real labels.

### Mobile (physical device)

See [device-qa.md](./device-qa.md) for the full checklist. Quick smoke test:

- [ ] Camera opens without shutter button
- [ ] White-outline boxes appear while panning
- [ ] “Enhancing with cloud AI…” every ~3–4 s
- [ ] Blue badges appear after cloud response
- [ ] Cloud toggle off → on-device only still works

### Automated tests

```bash
# Backend
cd backend && source .venv/bin/activate && PYTHONPATH=. pytest tests/ -q

# Mobile
cd mobile && npm test && npm run typecheck
```

---

## Production checklist

### Security

- [ ] Replace default `API_KEY` on backend and mobile
- [ ] Enable HTTPS (TLS certificate)
- [ ] Restrict `CORS_ORIGINS` to your app origin
- [ ] Do not commit `.env` files (already in `.gitignore`)
- [ ] Store secrets in EAS Secrets / cloud provider secret manager
- [ ] Rate-limit at reverse proxy (e.g. 30 req/min per IP)

### Reliability

- [ ] Keep GPU instance warm (cold start = model reload)
- [ ] Persist Hugging Face cache volume
- [ ] Set `proxy_read_timeout` ≥ 120s on nginx
- [ ] Monitor `/health` endpoint (UptimeRobot, etc.)
- [ ] Log `inference_ms` to track latency regressions

### Cost control

- [ ] Start with `MAX_IMAGE_EDGE=960` (mobile already downscales)
- [ ] Use `GENERATION_MODE=fast` for live scans
- [ ] Keep `taxonomy` scene lister unless you need OpenAI
- [ ] Scale GPU instance down when not demoing
- [ ] Client already limits cloud scans to 1 in-flight + 3 s minimum interval

### Legal

- [ ] Review [NVIDIA LocateAnything license](https://huggingface.co/nvidia/LocateAnything-3B) — non-commercial research by default
- [ ] Add privacy policy if collecting camera images on server (this app does not persist images by default)

---

## Tips and tricks

### Development speed

1. **Develop UI with mock backend first** — zero GPU cost, instant feedback.
2. **Use the same API key everywhere during dev** — avoids mysterious 401 errors.
3. **Test on a real phone early** — simulators do not exercise Vision Camera frame outputs fully.
4. **`npx expo start --dev-client`** after the first native build for fast JS reloads.

### Networking

1. **Phone cannot reach `localhost`** — always use LAN IP or deployed HTTPS URL.
2. **macOS firewall** — allow incoming connections for Python/uvicorn on port 8000.
3. **Corporate Wi‑Fi** — client isolation blocks phone→laptop; use phone hotspot or deploy to cloud early.
4. **Android emulator** — use `10.0.2.2` instead of `localhost`.

### GPU savings

1. **`MAX_IMAGE_EDGE=960`** cuts VRAM and latency with minimal accuracy loss for mobile keyframes.
2. **`GENERATION_MODE=fast`** — use `hybrid` only if boxes look truncated or misaligned.
3. **Single uvicorn worker** — multiple workers = multiple model copies = OOM.
4. **Pre-download model** in Docker image build step to avoid download on every pod restart.

### Mobile battery

1. Increase `localProcessEveryNthFrame` from 3 → 5 in `mobile/lib/config.ts`.
2. Increase `cloudScanIntervalMs` from 3500 → 5000 for less upload traffic.
3. Turn off “Cloud enrichment” in the app UI when offline.

### Debugging cloud enrichment

1. Watch backend logs during scan — look for inference time spikes.
2. If status shows “Cloud enhancement unavailable”, check:
   - Wrong API URL on phone
   - API key mismatch
   - Backend not reachable (HTTP blocked, wrong port)
   - Backend OOM (reduce `MAX_IMAGE_EDGE`)
3. Test backend directly with `curl` before blaming the app.

### Docker on RunPod (quick pattern)

```bash
# On RunPod terminal
git clone <repo> && cd cursor_prj30062026/backend
huggingface-cli login
docker build -t scanner .
docker run --gpus all -p 8000:8000 --env-file .env -v hf:/root/.cache/huggingface scanner
```

Expose port 8000 in RunPod template → use public IP in mobile `.env`.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| 401 on `/v1/scan` | API key mismatch | Align `API_KEY` and `EXPO_PUBLIC_API_KEY` |
| Cloud never enriches | Phone uses `localhost` | Set LAN IP or HTTPS URL |
| `mock_mode: true` on GPU | `MOCK_INFERENCE=true` or model load failed | Check logs; set `MOCK_INFERENCE=false` |
| CUDA OOM | Image too large / multiple workers | Lower `MAX_IMAGE_EDGE`; use 1 worker |
| Slow first scan | Cold model load | Keep instance warm; cache HF weights |
| No camera / black screen | Expo Go used instead of dev client | `npx expo prebuild && npx expo run:ios` |
| Boxes misaligned | Aspect ratio mismatch | Test portrait; check overlay mapping in `coordinates.ts` |
| Build fails after dep change | Stale native project | `npx expo prebuild --clean` |
| iOS ATS blocks HTTP | Non-HTTPS in production | Use HTTPS or ATS exception (dev only) |

### Useful log commands

```bash
# Backend verbose
uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level debug

# Docker logs
docker logs -f <container_id>

# Mobile Metro
npx expo start --dev-client
```

---

## License reminder

[NVIDIA LocateAnything-3B](https://huggingface.co/nvidia/LocateAnything-3B) is released under the **NVIDIA Open Model License** for **non-commercial research and development**. Commercial App Store distribution requires a separate license from NVIDIA or an alternative model.

---

## Quick reference commands

```bash
# ── Backend (local mock) ──
cd backend && source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# ── Backend (tests) ──
PYTHONPATH=. pytest tests/ -q

# ── Mobile (first build) ──
cd mobile && npm install && npx expo prebuild && npx expo run:ios

# ── Mobile (subsequent JS-only changes) ──
npx expo start --dev-client

# ── Health check ──
curl http://localhost:8000/health
```

For API details see [api.md](./api.md). For device testing see [device-qa.md](./device-qa.md).
