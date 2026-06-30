from pydantic import BaseModel, Field


class Detection(BaseModel):
    label: str
    x1: float
    y1: float
    x2: float
    y2: float
    source: str = Field(default="cloud", description="cloud | local")
    confidence: float | None = None


class ScanResponse(BaseModel):
    image_width: int
    image_height: int
    inference_ms: int
    categories_used: list[str]
    detections: list[Detection]
    mock: bool = False


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    mock_mode: bool
    device: str | None = None


class GroundRequest(BaseModel):
    phrase: str
    image_width: int | None = None
    image_height: int | None = None
