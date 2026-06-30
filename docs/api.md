# Surroundings Scanner API

## Authentication

All scan endpoints require header:

```
X-API-Key: <your-api-key>
```

## POST /v1/scan

Multipart upload of a JPEG/PNG keyframe. Runs taxonomy discovery + LocateAnything grounding.

**Response**

```json
{
  "image_width": 1280,
  "image_height": 960,
  "inference_ms": 4200,
  "categories_used": ["taxonomy_batches"],
  "mock": false,
  "detections": [
    {
      "label": "mug",
      "x1": 120.0,
      "y1": 340.0,
      "x2": 210.0,
      "y2": 480.0,
      "source": "cloud",
      "confidence": null
    }
  ]
}
```

## POST /v1/ground

Multipart fields:

- `file`: image
- `phrase`: natural language phrase to locate

## GET /health

Returns model readiness and mock mode status.
