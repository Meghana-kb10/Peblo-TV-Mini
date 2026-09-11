import io
from pathlib import Path
import pytest
from PIL import Image
from backend.app.services.artwork_validator import validate_artwork, ArtworkValidationError

BASE_DIR = Path(__file__).resolve().parent.parent.parent

def test_valid_artwork_samples():
    # poster_good.jpg (600x900, 2:3)
    with open(BASE_DIR / "poster_good.jpg", "rb") as f:
        w, h, ratio, fmt = validate_artwork(f.read(), "poster")
        assert w == 600 and h == 900
        assert abs(ratio - 0.6667) < 0.01
        assert fmt == "JPEG"

    # banner_good.jpg (1280x720, 16:9)
    with open(BASE_DIR / "banner_good.jpg", "rb") as f:
        w, h, ratio, fmt = validate_artwork(f.read(), "banner")
        assert w == 1280 and h == 720
        assert abs(ratio - 1.7778) < 0.01

    # thumb_good.jpg (640x360, 16:9)
    with open(BASE_DIR / "thumb_good.jpg", "rb") as f:
        w, h, ratio, fmt = validate_artwork(f.read(), "thumbnail")
        assert w == 640 and h == 360
        assert abs(ratio - 1.7778) < 0.01

def test_wrong_aspect_ratio_rejected():
    with open(BASE_DIR / "poster_wrong_ratio.jpg", "rb") as f:
        with pytest.raises(ArtworkValidationError) as exc:
            validate_artwork(f.read(), "poster")
        assert "Incorrect aspect ratio for Poster" in str(exc.value)
        assert "2:3" in str(exc.value)

def test_oversized_dimensions_rejected():
    with open(BASE_DIR / "banner_too_big.png", "rb") as f:
        with pytest.raises(ArtworkValidationError) as exc:
            validate_artwork(f.read(), "banner")
        assert "too large" in str(exc.value)

def test_undersized_dimensions_rejected():
    with open(BASE_DIR / "thumb_tiny.jpg", "rb") as f:
        with pytest.raises(ArtworkValidationError) as exc:
            validate_artwork(f.read(), "thumbnail")
        assert "Resolution is too low" in str(exc.value)

def test_max_file_size_enforced():
    # 205 KB payload
    oversized = b"X" * (205 * 1024)
    with pytest.raises(ArtworkValidationError) as exc:
        validate_artwork(oversized, "poster")
    assert "exceeds the 200 KB limit" in str(exc.value)

def test_invalid_image_slot():
    with pytest.raises(ArtworkValidationError) as exc:
        validate_artwork(b"123", "nonexistent_slot")
    assert "Unknown artwork slot" in str(exc.value)
