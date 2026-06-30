# Surroundings Scanner

Hybrid live mobile app (iOS/Android) with a GPU backend powered by [NVIDIA LocateAnything-3B](https://huggingface.co/nvidia/LocateAnything-3B).

## Architecture

- **Mobile (`mobile/`)**: Expo dev client + Vision Camera live preview, on-device overlays, periodic cloud enrichment
- **Backend (`backend/`)**: FastAPI `/v1/scan` service with taxonomy-based scan-all pipeline and mock mode for local dev

See [docs/api.md](docs/api.md) and [docs/device-qa.md](docs/device-qa.md).

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn pydantic pydantic-settings python-multipart Pillow numpy httpx
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Set `MOCK_INFERENCE=false` and install CUDA PyTorch + full `requirements.txt` on a GPU machine for real LocateAnything inference.

## Mobile

```bash
cd mobile
cp .env.example .env
npm install
npx expo prebuild
npx expo run:ios   # or run:android
```

Configure `EXPO_PUBLIC_API_URL` to your backend LAN IP when testing on a physical device.

## Tests

```bash
cd backend && source .venv/bin/activate && PYTHONPATH=. pytest tests/ -q
cd ../mobile && npm test
```

## License note

LocateAnything-3B is released under the NVIDIA Open Model License for non-commercial research. Review licensing before shipping a commercial app.
