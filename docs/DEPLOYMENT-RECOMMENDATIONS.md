# Deployment Recommendations

Analysis and actionable recommendations after reviewing the current
[DEPLOYMENT.md](./DEPLOYMENT.md), backend source, Dockerfile, and mobile
configuration.

---

## Summary of current deployment

The guide covers four backend options (Docker GPU, bare metal GPU, mock, and
OpenAI-enhanced) and three mobile tracks (dev build, internal/TestFlight, and
store release). The stack is solid for a prototype, but several gaps would need
closing before a production launch.

---

## 1 · Infrastructure & Architecture

### 1.1 Container image improvements

> [!WARNING]
> The current Dockerfile installs `torch` and all Python deps at runtime,
> producing large, slow, and non-reproducible builds.

| Issue | Recommendation |
|-------|----------------|
| No multi-stage build | Use a **build stage** for pip installs and a slim **runtime stage** to cut image size by ~40 %. |
| Model weights download at boot | Add a `RUN huggingface-cli download nvidia/LocateAnything-3B` layer so weights are baked into the image. First-start delay drops from 5–15 min to zero. |
| No health check in image | Add `HEALTHCHECK CMD curl -f http://localhost:8000/health \|\| exit 1` so orchestrators know when the container is ready. |
| No `.dockerignore` | Create one excluding `.venv/`, `__pycache__/`, `.env`, `tests/`, `.git/` to speed up context transfer. |
| Pinned CUDA but not base digest | Pin the base image SHA for reproducible builds: `nvidia/cuda:12.4.1-runtime-ubuntu22.04@sha256:<digest>`. |

### 1.2 Orchestration

The guide only covers raw `docker run`. For anything beyond a single VM:

- **Minimum viable**: Use **Docker Compose** with a `docker-compose.gpu.yml` that
  defines the API service, an nginx reverse-proxy sidecar, and a
  `restart: unless-stopped` policy.
- **Scaling up**: Deploy on **Kubernetes** with the
  [NVIDIA GPU Operator](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/overview.html).
  Use a `Deployment` with `resources.limits: nvidia.com/gpu: 1` and a
  `readinessProbe` on `/health`.
- **Serverless alternative**: The guide mentions Modal briefly. A proper
  Modal / BentoML / Replicate config file should be committed to the repo if
  that path is chosen, so deploys are reproducible.

### 1.3 Autoscaling & cold-start mitigation

The 3B model takes ~5–15 min to cold-load. Strategies:

1. **Keep-warm cron**: A simple health-check ping every 5 min prevents cloud
   providers from evicting idle GPU instances.
2. **Pre-warmed replicas**: On K8s, run a minimum of 1 replica with
   `minReplicas: 1` in the HPA.
3. **Request queuing**: Currently uvicorn processes requests sequentially
   (single worker). Add a **lightweight request queue** (Redis + Celery or
   `asyncio.Queue`) so the API returns `202 Accepted` immediately and the
   client polls for results, preventing timeouts on slow inferences.

---

## 2 · Security

> [!CAUTION]
> Several of the items below are **required** before any public-facing deploy.

### 2.1 API authentication

| Current state | Recommendation |
|---------------|----------------|
| Single static API key in `.env` | Fine for prototype. For production, issue **per-device keys** or use **short-lived JWTs** signed by a lightweight auth service. |
| Key sent in `X-API-Key` header | OK, but ensure it is only transmitted over **HTTPS**. The guide mentions HTTPS but does not enforce it in code. |
| Default key is `dev-key-change-me` | Add a **startup check** in `main.py` that refuses to start if the key is still the default and `MOCK_INFERENCE=false`. |

### 2.2 Rate limiting

The guide suggests nginx rate-limiting, but nothing is configured.

- Add **`slowapi`** or **`fastapi-limiter`** middleware to the backend with
  sensible defaults (e.g., 30 req/min per IP, 5 req/min per API key for
  `/v1/scan`).
- Rate-limit at the reverse proxy layer as a second line of defence.

### 2.3 Input validation hardening

- **File-type sniffing**: Validate uploaded file magic bytes, not just the
  extension. Reject non-image payloads before they reach Pillow.
- **Size guard**: `MAX_IMAGE_BYTES` exists but should return a clear `413` with
  a JSON body. Verify this is tested.
- **Filename sanitisation**: Multipart filenames are user-controlled. Ensure
  they are never used in filesystem paths.

### 2.4 CORS

`CORS_ORIGINS=*` is the default. The production checklist mentions restricting
it, but the `.env.example` ships with `*`. Change the example to an explicit
placeholder:

```env
CORS_ORIGINS=https://your-app.example.com
```

### 2.5 Secrets management

- **Mobile**: `EXPO_PUBLIC_*` vars are embedded in the JS bundle and visible
  to anyone who decompiles the app. For production, rotate API keys frequently
  and treat them as **low-trust tokens** — the backend should enforce
  per-user auth or device attestation as the real security boundary.
- **Backend**: Use a secrets manager (GCP Secret Manager, AWS SSM, Vault) instead
  of `.env` files on production VMs.

---

## 3 · Reliability & Observability

### 3.1 Structured logging

The backend currently uses default uvicorn logging. Add:

- **Structured JSON logs** via `python-json-logger` or `structlog`.
- Log every request with: `request_id`, `inference_ms`, `image_size`,
  `detections_count`, `mock` flag.
- This makes log aggregation (CloudWatch, GCP Logging, Datadog) trivial.

### 3.2 Health check improvements

The `/health` endpoint exists but should include:

| Field | Purpose |
|-------|---------|
| `gpu_available` | Confirms CUDA is accessible at runtime |
| `model_loaded` | Already present — good |
| `vram_usage_mb` | Early warning for OOM |
| `uptime_seconds` | Helps correlate cold-start issues |
| `version` | Git SHA or semver for deploy tracking |

### 3.3 Error handling & graceful degradation

- If the GPU OOMs mid-inference, the worker should catch the exception, log it,
  and return a `503 Service Unavailable` — not crash the process.
- If the model fails to load at startup, the app currently falls back to mock
  mode silently. This should be a **loud warning** in logs and the health
  endpoint should report `degraded`.

### 3.4 Monitoring & alerting

Set up:

- **Uptime monitoring** on `/health` (UptimeRobot, Pingdom, or
  GCP uptime checks — already mentioned but not implemented).
- **Latency P95 alerting** when `inference_ms` exceeds a threshold (e.g., 10 s).
- **GPU memory alerts** via `nvidia-smi` metrics exported to Prometheus/Grafana
  or cloud monitoring.

---

## 4 · CI/CD & Testing

### 4.1 Automated pipeline

No CI/CD is configured. Recommended minimal pipeline:

```
push to main
  ├─ Backend: lint (ruff) → pytest → docker build → push to registry
  └─ Mobile:  typecheck → jest → EAS build (preview profile)
```

Use **GitHub Actions** with:

- A `backend-ci.yml` that runs in a Python 3.11 container.
- A `mobile-ci.yml` that runs type checking and unit tests (EAS build can be
  triggered manually or on tags).

### 4.2 Test coverage gaps

| Area | Current | Recommendation |
|------|---------|----------------|
| Backend API | 2 test files | Add integration tests that POST real images and validate response schema |
| Backend parser | Has tests | Good — maintain as model output format evolves |
| Backend scanner/worker | None | Add unit tests with mocked model to verify pipeline logic |
| Mobile lib | `__tests__/` dir exists | Ensure `mergeDetections`, `scanOrchestrator`, `coordinates` all have tests |
| E2E | None | Add a smoke-test script that starts mock backend + hits `/v1/scan` with a sample image |

### 4.3 Linting & formatting

No linter is configured for the backend. Add:

- **`ruff`** for linting and formatting (fast, all-in-one).
- Add a `ruff.toml` or `pyproject.toml [tool.ruff]` section.
- The mobile side has TypeScript — `npm run typecheck` exists, which is good.
  Consider adding **ESLint** for style enforcement.

---

## 5 · Cost Optimisation

### 5.1 GPU cost modelling

At current cloud GPU rates (mid-2026 estimates):

| Provider | GPU | Hourly cost | Monthly (24×7) |
|----------|-----|-------------|----------------|
| RunPod | RTX 4090 | ~$0.40 | ~$290 |
| AWS | g5.xlarge (A10G) | ~$1.00 | ~$730 |
| GCP | g2-standard-4 (L4) | ~$0.70 | ~$510 |
| Lambda Labs | A10 | ~$0.60 | ~$440 |

> [!TIP]
> For intermittent usage (demos, testing), prefer **spot/preemptible instances**
> or **serverless GPU** (Modal, Banana, Replicate) to avoid paying for idle
> time.

### 5.2 Specific savings levers

1. **Right-size `MAX_IMAGE_EDGE`**: Mobile already downscales to 960 px before
   upload. Set the backend default to `960` instead of `1280` — the extra
   downscale is wasted work.
2. **Batch inference**: If multiple clients send frames simultaneously, batch
   them into a single forward pass. LocateAnything supports batched input.
3. **Model quantisation**: Investigate INT8 or FP8 quantisation of the 3B model
   to halve VRAM requirements and enable cheaper GPUs (e.g., 8 GB cards).
4. **Scheduled shutdown**: For non-production environments, schedule GPU
   instances to shut down outside business hours.

---

## 6 · Mobile-specific

### 6.1 On-device detector

The current `onDeviceDetector.ts` is a placeholder. The guide mentions
`react-native-executorch` with SSD MobileNet or RF-DETR Nano. Prioritise this:

- Real on-device detection makes the app useful **offline**.
- It dramatically reduces backend load and cost.
- Users perceive the app as faster (local boxes in ~50 ms vs 3.5 s cloud
  round-trip).

### 6.2 OTA updates

Set up **EAS Update** for JS-only changes so you can push fixes without
rebuilding the native binary:

```bash
eas update --branch production --message "Fix overlay alignment"
```

This is especially valuable once the app is in TestFlight/Play Store.

### 6.3 Network resilience

- **Retry with backoff**: `scanOrchestrator.ts` should retry failed cloud scans
  with exponential backoff (1 s → 2 s → 4 s → give up) instead of silently
  dropping.
- **Offline detection**: If the device is offline, skip cloud enrichment
  entirely and show only local boxes — don't queue requests.
- **Request cancellation**: When a new keyframe is ready, cancel the in-flight
  request for the previous one to avoid stale overlays.

### 6.4 App Store readiness

- [ ] Replace placeholder icons and splash screens in `mobile/assets/`.
- [ ] Add a privacy policy (camera access + optional cloud image upload).
- [ ] Add `NSCameraUsageDescription` localisation for non-English markets.
- [ ] Test on both iPhone SE (small screen) and iPad (split-view).
- [ ] Confirm `app.json` has correct `bundleIdentifier` and `package`.

---

## 7 · Legal & Licensing

> [!IMPORTANT]
> The LocateAnything-3B model is licensed for **non-commercial research only**
> under the NVIDIA Open Model License.

Before any commercial launch:

1. **Contact NVIDIA** for a commercial license, or
2. **Swap the model** for a commercially-licensed alternative (e.g.,
   GroundingDINO, OWLv2, Florence-2, or a fine-tuned YOLO-World).
3. **Document the decision** and update `requirements.txt` and the Dockerfile
   accordingly.

If the app collects camera images (even transiently on the server), a
**privacy policy** and, for EU users, a **GDPR data processing disclosure**
is required.

---

## 8 · Proposed action plan

Priority-ordered next steps:

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | Add `.dockerignore` and multi-stage Dockerfile | Small | Faster, smaller builds |
| 2 | Add startup check for default API key in production | Small | Prevents accidental exposure |
| 3 | Add rate limiting (`slowapi`) | Small | Prevents abuse |
| 4 | Set up GitHub Actions CI (lint + test + build) | Medium | Catches regressions early |
| 5 | Improve health endpoint (GPU, VRAM, version) | Small | Better observability |
| 6 | Add structured JSON logging | Small | Production debuggability |
| 7 | Create `docker-compose.gpu.yml` with nginx sidecar | Medium | One-command production deploy |
| 8 | Bake model weights into Docker image | Medium | Eliminates cold-start delay |
| 9 | Integrate real on-device detector (ExecuTorch) | Large | Offline UX, cost savings |
| 10 | Resolve licensing for commercial use | Large | Legal blocker for store release |

---

*Generated on 2026-06-30 based on the current state of the repository.*
