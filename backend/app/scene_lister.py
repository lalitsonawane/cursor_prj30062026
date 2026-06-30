import json
import logging
from typing import Protocol

import httpx
from PIL import Image

from app.config import settings
from app.taxonomy import default_scan_categories, taxonomy_batches

logger = logging.getLogger(__name__)


class SceneLister(Protocol):
    def list_categories(self, image: Image.Image, max_categories: int = 25) -> list[str]: ...


class TaxonomySceneLister:
    """MVP stage-1: use a broad fixed taxonomy subset for scan-all."""

    def list_categories(self, image: Image.Image, max_categories: int = 25) -> list[str]:
        _ = image
        return default_scan_categories(max_categories)


class OpenAISceneLister:
    """Optional stage-1: ask a fast VLM for visible object nouns."""

    def __init__(self, api_key: str, model: str) -> None:
        self.api_key = api_key
        self.model = model

    def list_categories(self, image: Image.Image, max_categories: int = 25) -> list[str]:
        if not self.api_key:
            logger.warning("OPENAI_API_KEY missing; falling back to taxonomy lister")
            return default_scan_categories(max_categories)

        import base64
        import io

        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=85)
        encoded = base64.b64encode(buffer.getvalue()).decode("ascii")

        prompt = (
            "Return only a JSON array of distinct visible object nouns in this image, "
            f"max {max_categories}, lowercase, no sentences."
        )

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{encoded}"},
                        },
                    ],
                }
            ],
            "max_tokens": 300,
        }

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json=payload,
                )
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"]
                categories = json.loads(content)
                if isinstance(categories, list):
                    return [str(item).strip().lower() for item in categories][:max_categories]
        except Exception as exc:
            logger.exception("OpenAI scene lister failed: %s", exc)

        return default_scan_categories(max_categories)


def build_scene_lister() -> SceneLister:
    if settings.scene_lister_mode == "openai":
        return OpenAISceneLister(settings.openai_api_key, settings.openai_model)
    return TaxonomySceneLister()


def batched_taxonomy_categories() -> list[list[str]]:
    return taxonomy_batches()
