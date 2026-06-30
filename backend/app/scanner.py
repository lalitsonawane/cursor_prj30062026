import logging
import time

from PIL import Image

from app.config import settings
from app.parser import ParsedBox
from app.scene_lister import SceneLister, build_scene_lister
from app.taxonomy import taxonomy_batches
from app.schemas import Detection, ScanResponse
from app.worker import LocateAnythingWorker

logger = logging.getLogger(__name__)


class ScanService:
    def __init__(self, worker: LocateAnythingWorker, scene_lister: SceneLister | None = None) -> None:
        self.worker = worker
        self.scene_lister = scene_lister or build_scene_lister()

    def scan(self, image: Image.Image) -> ScanResponse:
        started = time.perf_counter()
        categories = self.scene_lister.list_categories(image, max_categories=25)

        if settings.scene_lister_mode == "taxonomy":
            all_boxes = self._scan_with_taxonomy_batches(image)
            categories_used = ["taxonomy_batches"]
        else:
            all_boxes = self._scan_with_categories(image, categories)
            categories_used = categories

        detections = [
            Detection(
                label=box.label,
                x1=box.x1,
                y1=box.y1,
                x2=box.x2,
                y2=box.y2,
                source="cloud",
            )
            for box in all_boxes
        ]

        elapsed_ms = int((time.perf_counter() - started) * 1000)
        return ScanResponse(
            image_width=image.width,
            image_height=image.height,
            inference_ms=elapsed_ms,
            categories_used=categories_used,
            detections=detections,
            mock=self.worker.mock,
        )

    def ground(self, image: Image.Image, phrase: str) -> ScanResponse:
        started = time.perf_counter()
        result = self.worker.ground_multi(image, phrase)
        boxes = self.worker.parse_detections(result["answer"], image)
        elapsed_ms = int((time.perf_counter() - started) * 1000)

        return ScanResponse(
            image_width=image.width,
            image_height=image.height,
            inference_ms=elapsed_ms,
            categories_used=[phrase],
            detections=[
                Detection(
                    label=box.label,
                    x1=box.x1,
                    y1=box.y1,
                    x2=box.x2,
                    y2=box.y2,
                    source="cloud",
                )
                for box in boxes
            ],
            mock=self.worker.mock,
        )

    def _scan_with_categories(self, image: Image.Image, categories: list[str]) -> list[ParsedBox]:
        if not categories:
            return []

        chunk_size = 20
        merged: list[ParsedBox] = []
        for index in range(0, len(categories), chunk_size):
            chunk = categories[index : index + chunk_size]
            result = self.worker.detect(image, chunk)
            merged.extend(self.worker.parse_detections(result["answer"], image))

        return self._dedupe(merged)

    def _scan_with_taxonomy_batches(self, image: Image.Image) -> list[ParsedBox]:
        merged: list[ParsedBox] = []
        for batch in taxonomy_batches()[:4]:
            result = self.worker.detect(image, batch)
            merged.extend(self.worker.parse_detections(result["answer"], image))
        return self._dedupe(merged)

    def _dedupe(self, boxes: list[ParsedBox]) -> list[ParsedBox]:
        from app.parser import dedupe_boxes

        return dedupe_boxes(boxes)
