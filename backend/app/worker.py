import logging
import random
import time
from typing import Any

from PIL import Image

from app.config import settings
from app.parser import ParsedBox, dedupe_boxes, parse_boxes

logger = logging.getLogger(__name__)


class LocateAnythingWorker:
    """Wraps NVIDIA LocateAnything-3B with a mock fallback for local development."""

    def __init__(self, model_path: str, mock: bool = False) -> None:
        self.model_path = model_path
        self.mock = mock
        self.device: str | None = None
        self._worker: Any = None

        if mock:
            logger.info("LocateAnything worker running in MOCK mode")
            return

        try:
            import torch
            from transformers import AutoModel, AutoProcessor, AutoTokenizer

            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info("Loading LocateAnything from %s on %s", model_path, self.device)

            tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)
            processor = AutoProcessor.from_pretrained(model_path, trust_remote_code=True)
            dtype = torch.bfloat16 if self.device == "cuda" else torch.float32
            model = AutoModel.from_pretrained(
                model_path,
                torch_dtype=dtype,
                trust_remote_code=True,
            ).to(self.device).eval()

            self._worker = _RealWorker(tokenizer, processor, model, self.device, dtype)
            logger.info("LocateAnything model loaded")
        except Exception as exc:
            logger.exception("Failed to load LocateAnything model; using mock mode: %s", exc)
            self.mock = True

    @property
    def is_loaded(self) -> bool:
        return self.mock or self._worker is not None

    def detect(
        self,
        image: Image.Image,
        categories: list[str],
        generation_mode: str | None = None,
        max_new_tokens: int | None = None,
    ) -> dict[str, Any]:
        if self.mock:
            return self._mock_detect(image, categories)

        assert self._worker is not None
        return self._worker.detect(
            image,
            categories,
            generation_mode=generation_mode or settings.generation_mode,
            max_new_tokens=max_new_tokens or settings.max_new_tokens,
        )

    def ground_multi(
        self,
        image: Image.Image,
        phrase: str,
        generation_mode: str | None = None,
        max_new_tokens: int | None = None,
    ) -> dict[str, Any]:
        if self.mock:
            return self._mock_ground(image, phrase)

        assert self._worker is not None
        return self._worker.ground_multi(
            image,
            phrase,
            generation_mode=generation_mode or settings.generation_mode,
            max_new_tokens=max_new_tokens or settings.max_new_tokens,
        )

    def parse_detections(self, answer: str, image: Image.Image) -> list[ParsedBox]:
        return dedupe_boxes(parse_boxes(answer, image.width, image.height))

    def _mock_detect(self, image: Image.Image, categories: list[str]) -> dict[str, Any]:
        time.sleep(0.15)
        width, height = image.size
        rng = random.Random(width + height + len(categories))
        selected = categories[: min(6, len(categories))]
        if not selected:
            selected = ["object"]

        parts: list[str] = []
        for index, label in enumerate(selected):
            if rng.random() < 0.45:
                continue
            box_w = rng.uniform(0.08, 0.22) * width
            box_h = rng.uniform(0.08, 0.22) * height
            x1 = rng.uniform(0.05, 0.75) * width
            y1 = rng.uniform(0.05, 0.75) * height
            x2 = min(width - 1, x1 + box_w)
            y2 = min(height - 1, y1 + box_h)
            nx1 = int(x1 / width * 1000)
            ny1 = int(y1 / height * 1000)
            nx2 = int(x2 / width * 1000)
            ny2 = int(y2 / height * 1000)
            parts.append(f"<semantic>{label}</semantic><box><{nx1}><{ny1}><{nx2}><{ny2}></box>")

        return {"answer": "".join(parts) if parts else "<semantic>object</semantic><box><100><100><300><300></box>"}

    def _mock_ground(self, image: Image.Image, phrase: str) -> dict[str, Any]:
        return self._mock_detect(image, [phrase])


class _RealWorker:
    def __init__(self, tokenizer, processor, model, device: str, dtype) -> None:
        self.tokenizer = tokenizer
        self.processor = processor
        self.model = model
        self.device = device
        self.dtype = dtype

    def detect(
        self,
        image: Image.Image,
        categories: list[str],
        generation_mode: str,
        max_new_tokens: int,
    ) -> dict[str, Any]:
        cats = "</c>".join(categories)
        prompt = f"Locate all the instances that matches the following description: {cats}."
        return self._predict(image, prompt, generation_mode, max_new_tokens)

    def ground_multi(
        self,
        image: Image.Image,
        phrase: str,
        generation_mode: str,
        max_new_tokens: int,
    ) -> dict[str, Any]:
        prompt = f"Locate all the instances that match the following description: {phrase}."
        return self._predict(image, prompt, generation_mode, max_new_tokens)

    def _predict(
        self,
        image: Image.Image,
        question: str,
        generation_mode: str,
        max_new_tokens: int,
    ) -> dict[str, Any]:
        import torch

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": question},
                ],
            }
        ]

        text = self.processor.py_apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        images, videos = self.processor.process_vision_info(messages)
        inputs = self.processor(
            text=[text], images=images, videos=videos, return_tensors="pt"
        ).to(self.device)

        pixel_values = inputs["pixel_values"].to(self.dtype)
        input_ids = inputs["input_ids"]
        image_grid_hws = inputs.get("image_grid_hws", None)

        with torch.no_grad():
            response = self.model.generate(
                pixel_values=pixel_values,
                input_ids=input_ids,
                attention_mask=inputs["attention_mask"],
                image_grid_hws=image_grid_hws,
                tokenizer=self.tokenizer,
                max_new_tokens=max_new_tokens,
                use_cache=True,
                generation_mode=generation_mode,
                temperature=0.7,
                do_sample=True,
                top_p=0.9,
                repetition_penalty=1.1,
                verbose=False,
            )

        result = {"answer": response[0] if isinstance(response, tuple) else response}
        if isinstance(response, tuple) and len(response) >= 3:
            result["history"] = response[1]
            result["stats"] = response[2]
        return result
