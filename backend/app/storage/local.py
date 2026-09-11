import os
import json
import uuid
from pathlib import Path
from typing import Any, Optional
from backend.app.storage.base import StorageBackend

class LocalStorageBackend(StorageBackend):
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)
        # Standard subdirectories
        (self.base_dir / "artwork").mkdir(exist_ok=True)
        (self.base_dir / "catalog").mkdir(exist_ok=True)

    def _resolve_path(self, relative_path: str) -> Path:
        # Prevent directory traversal attacks
        clean_path = Path(relative_path.lstrip("/\\"))
        resolved = (self.base_dir / clean_path).resolve()
        if not str(resolved).startswith(str(self.base_dir)):
            raise ValueError("Illegal path traversal attempted")
        return resolved

    def save_file(self, content: bytes, relative_path: str, content_type: str = "application/octet-stream") -> str:
        target_path = self._resolve_path(relative_path)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        with open(target_path, "wb") as f:
            f.write(content)
        return relative_path

    def get_file(self, relative_path: str) -> bytes:
        target_path = self._resolve_path(relative_path)
        if not target_path.exists():
            raise FileNotFoundError(f"File not found: {relative_path}")
        with open(target_path, "rb") as f:
            return f.read()

    def delete_file(self, relative_path: str) -> None:
        target_path = self._resolve_path(relative_path)
        if target_path.exists():
            target_path.unlink()

    def atomic_write_json(self, data: Any, target_filename: str) -> str:
        """
        Atomically writes JSON to target_filename using a temporary file and os.replace.
        On POSIX and Windows (NTFS), os.replace is atomic when on the same filesystem.
        """
        target_path = self._resolve_path(target_filename)
        target_path.parent.mkdir(parents=True, exist_ok=True)

        # Temporary file created strictly in the SAME directory to ensure same filesystem
        temp_filename = f"{target_path.name}.tmp.{uuid.uuid4().hex}"
        temp_path = target_path.parent / temp_filename

        try:
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.flush()
                os.fsync(f.fileno())  # Flush OS buffers to physical disk

            # Atomic swap
            os.replace(temp_path, target_path)
            return target_filename
        except Exception as e:
            if temp_path.exists():
                try:
                    os.remove(temp_path)
                except OSError:
                    pass
            raise RuntimeError(f"Atomic write failed for {target_filename}: {e}") from e

    def read_json(self, target_filename: str) -> Optional[dict]:
        target_path = self._resolve_path(target_filename)
        if not target_path.exists():
            return None
        with open(target_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_public_url(self, relative_path: str) -> str:
        clean = relative_path.replace("\\", "/")
        if "artwork/" in clean:
            filename = clean.split("artwork/")[-1]
            return f"/static/artwork/{filename}"
        elif "catalog/" in clean:
            filename = clean.split("catalog/")[-1]
            return f"/static/catalog/{filename}"
        clean = clean.lstrip("/")
        return f"/static/{clean}"

    def exists(self, relative_path: str) -> bool:
        return self._resolve_path(relative_path).exists()
