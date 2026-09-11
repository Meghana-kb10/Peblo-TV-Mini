import json
from typing import Any, Optional
from backend.app.storage.base import StorageBackend

class CloudflareR2StorageBackend(StorageBackend):
    """
    Cloudflare R2 storage backend (S3-compatible API).
    Swap to this simply by setting STORAGE_BACKEND=r2 in .env.
    """
    def __init__(
        self,
        endpoint_url: str,
        bucket_name: str,
        access_key_id: str,
        secret_access_key: str,
        public_base_url: str = "https://catalog.peblo.tv"
    ):
        self.endpoint_url = endpoint_url
        self.bucket_name = bucket_name
        self.public_base_url = public_base_url.rstrip("/")
        
        try:
            import boto3
            self.s3_client = boto3.client(
                "s3",
                endpoint_url=endpoint_url,
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_access_key,
                region_name="auto"
            )
        except Exception as e:
            self.s3_client = None
            self.init_error = str(e)

    def save_file(self, content: bytes, relative_path: str, content_type: str = "application/octet-stream") -> str:
        if not self.s3_client:
            raise RuntimeError("R2 client not initialized. Check credentials or boto3 installation.")
        key = relative_path.replace("\\", "/").lstrip("/")
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=content,
            ContentType=content_type
        )
        return key

    def get_file(self, relative_path: str) -> bytes:
        if not self.s3_client:
            raise RuntimeError("R2 client not initialized.")
        key = relative_path.replace("\\", "/").lstrip("/")
        resp = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
        return resp["Body"].read()

    def delete_file(self, relative_path: str) -> None:
        if not self.s3_client:
            raise RuntimeError("R2 client not initialized.")
        key = relative_path.replace("\\", "/").lstrip("/")
        self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)

    def atomic_write_json(self, data: Any, target_filename: str) -> str:
        """
        S3/R2 PutObject is inherently atomic at the object boundary.
        A reader issuing GET will never see a partially uploaded payload.
        """
        payload = json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
        return self.save_file(payload, target_filename, content_type="application/json")

    def read_json(self, target_filename: str) -> Optional[dict]:
        try:
            raw = self.get_file(target_filename)
            return json.loads(raw.decode("utf-8"))
        except Exception as exc:
            # A missing object is an expected "not published" state. Network,
            # authentication, and malformed-object failures must be visible to
            # health/readiness rather than being treated as a missing catalogue.
            try:
                from botocore.exceptions import ClientError

                if isinstance(exc, ClientError):
                    code = exc.response.get("Error", {}).get("Code")
                    if code in {"404", "NoSuchKey", "NoSuchObject"}:
                        return None
            except ImportError:
                pass
            raise

    def get_public_url(self, relative_path: str) -> str:
        key = relative_path.replace("\\", "/").lstrip("/")
        return f"{self.public_base_url}/{key}"

    def exists(self, relative_path: str) -> bool:
        if not self.s3_client:
            return False
        key = relative_path.replace("\\", "/").lstrip("/")
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=key)
            return True
        except Exception:
            return False
