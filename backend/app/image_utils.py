import io
from PIL import Image


def load_and_resize_image(data: bytes, max_edge: int) -> Image.Image:
    image = Image.open(io.BytesIO(data)).convert("RGB")
    width, height = image.size
    long_edge = max(width, height)

    if long_edge <= max_edge:
        return image

    scale = max_edge / long_edge
    new_size = (max(1, int(width * scale)), max(1, int(height * scale)))
    return image.resize(new_size, Image.Resampling.LANCZOS)
