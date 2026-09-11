from abc import ABC, abstractmethod
from typing import Any, Optional

class StorageBackend(ABC):
    """
    Abstract storage interface.
    Allows swapping between local filesystem and Cloudflare R2 / S3
    without changing any application logic.
    """

    @abstractmethod
    def save_file(self, content: bytes, relative_path: str, content_type: str = "application/octet-stream") -> str:
        """Saves a binary file to storage and returns its relative storage path or key."""
        pass

    @abstractmethod
    def get_file(self, relative_path: str) -> bytes:
        """Reads and returns the binary content of a file."""
        pass

    @abstractmethod
    def delete_file(self, relative_path: str) -> None:
        """Deletes a file after a successful temporary health probe."""
        pass

    @abstractmethod
    def atomic_write_json(self, data: Any, target_filename: str) -> str:
        """
        Atomically writes a JSON document to storage.
        Guarantees that readers never observe a partially written file.
        """
        pass

    @abstractmethod
    def read_json(self, target_filename: str) -> Optional[dict]:
        """Reads and parses a JSON document from storage. Returns None if not found."""
        pass

    @abstractmethod
    def get_public_url(self, relative_path: str) -> str:
        """Returns the public access URL for a stored asset."""
        pass

    @abstractmethod
    def exists(self, relative_path: str) -> bool:
        """Checks if a file exists in storage."""
        pass
