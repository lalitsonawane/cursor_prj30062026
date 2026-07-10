import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.image_utils import load_and_resize_image
from app.scanner import ScanService
from app.schemas import GroundRequest, HealthResponse, ScanResponse
from app.spreadsheet_ai import handle_spreadsheet_chat
from app.spreadsheet_schemas import SpreadsheetChatRequest, SpreadsheetChatResponse
from app.worker import LocateAnythingWorker

logger = logging.getLogger(__name__)

worker: LocateAnythingWorker | None = None
scan_service: ScanService | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global worker, scan_service
    worker = LocateAnythingWorker(settings.model_path, mock=settings.mock_inference)
    scan_service = ScanService(worker)
    logger.info("Scan service ready (mock=%s)", worker.mock)
    yield
    worker = None
    scan_service = None


app = FastAPI(title="Surroundings Scanner API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_api_key(x_api_key: str | None = Header(default=None)) -> None:
    if settings.api_key and x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


def get_scan_service() -> ScanService:
    if scan_service is None:
        raise HTTPException(status_code=503, detail="Service not ready")
    return scan_service


async def _read_image(file: UploadFile) -> bytes:
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Expected an image upload")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty upload")
    if len(data) > settings.max_image_bytes:
        raise HTTPException(status_code=413, detail="Image too large")
    return data


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model_loaded=worker.is_loaded if worker else False,
        mock_mode=worker.mock if worker else settings.mock_inference,
        device=worker.device if worker else None,
    )


@app.post("/v1/scan", response_model=ScanResponse, dependencies=[Depends(verify_api_key)])
async def scan_image(
    file: UploadFile = File(...),
    service: ScanService = Depends(get_scan_service),
) -> ScanResponse:
    data = await _read_image(file)
    image = load_and_resize_image(data, settings.max_image_edge)
    return service.scan(image)


@app.post("/v1/ground", response_model=ScanResponse, dependencies=[Depends(verify_api_key)])
async def ground_phrase(
    file: UploadFile = File(...),
    phrase: str = Form(...),
    service: ScanService = Depends(get_scan_service),
) -> ScanResponse:
    data = await _read_image(file)
    image = load_and_resize_image(data, settings.max_image_edge)
    if not phrase.strip():
        raise HTTPException(status_code=422, detail="Phrase is required")
    return service.ground(image, phrase.strip())


@app.post("/v1/spreadsheet/chat", response_model=SpreadsheetChatResponse)
async def spreadsheet_chat(body: SpreadsheetChatRequest) -> SpreadsheetChatResponse:
    """AI copilot for SheetCraft — no API key required (uses local rules as fallback)."""
    return await handle_spreadsheet_chat(body)
