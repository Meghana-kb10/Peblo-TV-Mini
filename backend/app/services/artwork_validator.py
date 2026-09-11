import io
from typing import Dict, Any, Tuple
from PIL import Image

MAX_FILE_BYTES = 200 * 1024  # 200 KB = 204,800 bytes

# Specs based on reference.json:
# poster: aspect 2:3 (~0.667), target 600x900
# banner: aspect 16:9 (~1.778), target 1280x720
# thumbnail: aspect 16:9 (~1.778), target 640x360
SPECS: Dict[str, Dict[str, Any]] = {
    "poster": {
        "aspect_name": "2:3",
        "target_ratio": 2.0 / 3.0,  # ~0.6667
        "ratio_tolerance": 0.05,    # 0.633 - 0.700
        "target_w": 600,
        "target_h": 900,
        "min_w": 400,
        "min_h": 600,
        "max_w": 1200,
        "max_h": 1800,
        "description": "Poster (2:3 portrait, ~600×900 px, max 200 KB)"
    },
    "banner": {
        "aspect_name": "16:9",
        "target_ratio": 16.0 / 9.0,  # ~1.7778
        "ratio_tolerance": 0.05,     # 1.689 - 1.867
        "target_w": 1280,
        "target_h": 720,
        "min_w": 960,
        "min_h": 540,
        "max_w": 1920,
        "max_h": 1080,
        "description": "Hero Banner (16:9 widescreen, ~1280×720 px, max 200 KB)"
    },
    "thumbnail": {
        "aspect_name": "16:9",
        "target_ratio": 16.0 / 9.0,  # ~1.7778
        "ratio_tolerance": 0.05,     # 1.689 - 1.867
        "target_w": 640,
        "target_h": 360,
        "min_w": 480,
        "min_h": 270,
        "max_w": 1280,
        "max_h": 720,
        "description": "Episode Thumbnail (16:9 widescreen, ~640×360 px, max 200 KB)"
    }
}

class ArtworkValidationError(ValueError):
    """Raised when an uploaded artwork violates specs."""
    pass

def validate_artwork(file_bytes: bytes, artwork_type: str) -> Tuple[int, int, float, str]:
    """
    Validates uploaded artwork image against reference.json specifications:
    - 200 KB maximum file size
    - Supported formats: JPEG, PNG, WebP
    - Aspect ratio with ±5% tolerance
    - Dimension sanity checks (min and max)
    
    Returns:
        Tuple of (width, height, aspect_ratio, format)
    Raises:
        ArtworkValidationError with actionable, non-technical editor guidance.
    """
    norm_type = artwork_type.lower().strip()
    if norm_type not in SPECS:
        allowed = ", ".join(SPECS.keys())
        raise ArtworkValidationError(
            f"Unknown artwork slot '{artwork_type}'. Allowed slots are: {allowed}."
        )

    spec = SPECS[norm_type]
    file_size = len(file_bytes)

    # 1. Enforce 200 KB ceiling
    if file_size > MAX_FILE_BYTES:
        size_kb = file_size / 1024
        excess = size_kb - 200
        raise ArtworkValidationError(
            f"File size ({size_kb:.1f} KB) exceeds the 200 KB limit by {excess:.1f} KB. "
            f"Please compress your image using an image optimizer before uploading."
        )

    if file_size == 0:
        raise ArtworkValidationError("The uploaded file is empty.")

    # 2. Inspect image data
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.verify()  # Verifies file integrity
        # Reopen for metadata inspection as verify() closes image
        image = Image.open(io.BytesIO(file_bytes))
    except Exception:
        raise ArtworkValidationError(
            "The uploaded file is corrupted or not a valid image. "
            "Please export a clean JPEG, PNG, or WebP file."
        )

    img_format = (image.format or "").upper()
    if img_format not in ["JPEG", "JPG", "PNG", "WEBP"]:
        raise ArtworkValidationError(
            f"Format '{img_format}' is not supported. Please upload a JPEG, PNG, or WebP image."
        )

    width, height = image.size
    if height == 0:
        raise ArtworkValidationError("Invalid image dimensions (height is 0).")

    actual_ratio = width / height
    target_ratio = spec["target_ratio"]
    tolerance = spec["ratio_tolerance"]

    # 3. Validate Aspect Ratio
    if abs(actual_ratio - target_ratio) > tolerance:
        raise ArtworkValidationError(
            f"Incorrect aspect ratio for {norm_type.capitalize()}. "
            f"Required ratio is {spec['aspect_name']} (~{spec['target_w']}×{spec['target_h']} px), "
            f"but uploaded image is {width}×{height} px (ratio {actual_ratio:.2f}). "
            f"Please crop your artwork to {spec['aspect_name']}."
        )

    # 4. Enforce Dimension bounds
    if width < spec["min_w"] or height < spec["min_h"]:
        raise ArtworkValidationError(
            f"Resolution is too low ({width}×{height} px). "
            f"{norm_type.capitalize()} requires approximately {spec['target_w']}×{spec['target_h']} px "
            f"(minimum {spec['min_w']}×{spec['min_h']} px) to prevent blurriness on screens."
        )

    if width > spec["max_w"] or height > spec["max_h"]:
        raise ArtworkValidationError(
            f"Image dimensions ({width}×{height} px) are too large for {norm_type.capitalize()}. "
            f"Target is ~{spec['target_w']}×{spec['target_h']} px (maximum allowed is {spec['max_w']}×{spec['max_h']} px). "
            f"Please resize the image before uploading."
        )

    return width, height, round(actual_ratio, 4), img_format
