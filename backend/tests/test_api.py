import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from app.config import settings
from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def _sample_jpeg() -> bytes:
    image = Image.new("RGB", (640, 480), color=(240, 240, 240))
    draw = ImageDraw.Draw(image)
    draw.rectangle((120, 100, 260, 240), fill=(180, 80, 60))
    draw.rectangle((360, 180, 520, 320), fill=(60, 120, 180))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["mock_mode"] is True


def test_scan_requires_api_key(client):
    response = client.post("/v1/scan", files={"file": ("test.jpg", _sample_jpeg(), "image/jpeg")})
    assert response.status_code == 401


def test_scan_returns_detections(client):
    headers = {"X-API-Key": settings.api_key}
    response = client.post(
        "/v1/scan",
        headers=headers,
        files={"file": ("test.jpg", _sample_jpeg(), "image/jpeg")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["image_width"] == 640
    assert body["image_height"] == 480
    assert isinstance(body["detections"], list)
    assert body["mock"] is True
