FROM python:3.11-slim

# Install system dependencies for PostgreSQL driver (psycopg2) and healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend source code and metadata/seed assets
COPY alembic.ini /app/alembic.ini
COPY backend /app/backend
COPY reference.json /app/reference.json
COPY seed_shows.json /app/seed_shows.json
COPY poster_good.jpg /app/poster_good.jpg
COPY poster_wrong_ratio.jpg /app/poster_wrong_ratio.jpg
COPY banner_good.jpg /app/banner_good.jpg
COPY banner_too_big.png /app/banner_too_big.png
COPY thumb_good.jpg /app/thumb_good.jpg
COPY thumb_tiny.jpg /app/thumb_tiny.jpg
COPY storage /app/storage

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/peblo_tv
ENV STORAGE_DIR=/app/storage
ENV REFERENCE_PATH=/app/reference.json
ENV SEED_PATH=/app/seed_shows.json

EXPOSE 8000

# Health check using the /health endpoint
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start Uvicorn (supports platform-injected $PORT with fallback to 8000)
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
