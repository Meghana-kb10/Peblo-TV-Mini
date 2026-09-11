# Peblo TV Mini 📺
### Full-Stack Platform Engineering Challenge: CMS Upload → Published Catalogue → Netflix-Style Browse

[![CI/CD Pipeline](https://github.com/peblo/peblo-tv-mini/actions/workflows/ci-cd.yml/badge.svg)](.github/workflows/ci-cd.yml)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?logo=docker&logoColor=white)](https://docker.com)

Peblo TV Mini is a miniature end-to-end streaming content delivery platform built across three integrated layers:
1. **Internal CMS (React + TypeScript)**: Content editor workspace featuring 3-slot artwork upload validation, show/season/episode management, publish blockers validation report, and publish audit log.
2. **Platform Backend (FastAPI + PostgreSQL / SQLite)**: Clean architecture API with schema migrations, strict role enforcement (`editor` vs `admin`), pluggable storage abstraction (Local Disk vs Cloudflare R2), atomic catalogue publishing pipeline, and composable search.
3. **Viewer Browse UI (React + TypeScript)**: Premium Netflix-style streaming experience reading exclusively from the published catalogue, complete with hero banner, category/language filters, season selection, and collapsed language variants (`en`/`hi`).

---

## 1. Quickstart & Running the App

### Option A: Running with Docker Compose (Recommended)

Bring up PostgreSQL, the FastAPI API, the Internal CMS, and the Netflix Viewer UI seeded and fully operational:

```bash
# 1. Copy the environment configuration template
cp .env.example .env

# 2. Build and start all services in detached mode
docker compose up --build -d

# 3. View service logs
docker compose logs -f
```

Once up, the following services will be accessible:
- **Viewer Browse UI**: [http://localhost:3001](http://localhost:3001)
- **Internal CMS**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend**: [http://localhost:8000](http://localhost:8000)
- **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint**: [http://localhost:8000/health](http://localhost:8000/health)

To stop and remove containers and networks:
```bash
docker compose down
```

---

### Option B: Running Locally (Development Mode)

#### 1. Backend (FastAPI)
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run the API server (will initialize schema and auto-seed seed_shows.json)
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Internal CMS (Port 3000 or 3002)
```bash
cd cms
npm install
npm run dev
```

#### 3. Viewer Browse UI (Port 3001 or 3003)
```bash
cd viewer
npm install
npm run dev
```

#### 4. Run Automated Test Suite
```bash
python -m pytest backend/tests -v
```

---

## 2. Part D — Pipeline & Operability

### 2.1 Docker Compose Architecture (`docker-compose.yml`)

The multi-container orchestration is organized as follows:

```
                  ┌────────────────┐
                  │ PostgreSQL 16  │ (Port 5432, Healthchecked)
                  └───────┬────────┘
                          │ (Database URL)
                          ▼
                  ┌────────────────┐
                  │  FastAPI API   │ (Port 8000, Uvicorn, Healthchecked)
                  └───────┬────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
  ┌───────────────┐               ┌───────────────┐
  │  Internal CMS │               │   Viewer UI   │
  │ (Port 3000)   │               │ (Port 3001)   │
  │ Nginx Reverse │               │ Nginx Reverse │
  │     Proxy     │               │     Proxy     │
  └───────────────┘               └───────────────┘
```

1. **`db` (PostgreSQL 16 Alpine)**: Persistent data storage with named volume `pg_data`. Configured with `pg_isready` health check so dependent services only start when the database is fully accepting connections.
2. **`api` (FastAPI + Python 3.11-slim)**: Built from `backend/Dockerfile`. On container startup, it auto-initializes database tables via SQLAlchemy, executes idempotent seed ingestion from `seed_shows.json`, and serves the pre-compiled `catalogue.json`. Evaluated with an automated Docker `HEALTHCHECK` probing `http://localhost:8000/health`.
3. **`cms` (Multi-Stage Dockerfile + Nginx)**: Stage 1 builds the TypeScript + React SPA with Vite; Stage 2 serves the production bundle via Nginx. The embedded `cms/nginx.conf` proxies `/admin`, `/catalog`, `/static`, and `/health` requests directly to `http://api:8000`.
4. **`viewer` (Multi-Stage Dockerfile + Nginx)**: Stage 1 builds the Netflix-style React SPA; Stage 2 serves the bundle via Nginx. `viewer/nginx.conf` proxies `/catalog` and `/static` directly to `http://api:8000`.

---

### 2.2 GitHub Actions CI/CD Workflow (`.github/workflows/ci-cd.yml`)

The repository includes a production-grade CI/CD workflow executing on every push and pull request to `main`:

1. **`lint-and-test` Job**:
   - Spawns a dedicated PostgreSQL 16 container service.
   - Sets up Python 3.11 and runs **Ruff** for linting.
   - Executes the complete **Pytest** test suite (testing artwork dimensions/aspect ratios/byte ceilings, CRUD constraints, publish atomicity, role authorization, composable search, and storage abstractions).
   - Sets up Node.js 20 and runs typechecks & production builds for both `cms` and `viewer` via `npm run build`.
2. **`build-images` Job**:
   - Uses `docker/setup-buildx-action` to build Docker images for `api`, `cms`, and `viewer` to prevent broken Docker configurations from reaching production.
3. **`deploy` Job (Explained & Documented)**:
   - Executes only on pushes to `main`.
   - **Step 1: Container Registry Push**: Images tagged with the Git commit SHA and `latest` are pushed to AWS ECR / Google Artifact Registry.
   - **Step 2: Database Schema Migration**: Runs `alembic upgrade head` as a pre-deploy ephemeral container/Kubernetes Job before traffic shifts to avoid migration race conditions.
   - **Step 3: Zero-Downtime Rolling Update**: Container orchestration (AWS ECS / Kubernetes / Cloud Run) performs a rolling or blue/green update. New tasks must pass the `/health` endpoint probe before receiving customer traffic.
   - **Step 4: Static Asset Deployment**: CMS and Viewer bundles are synced to Cloudflare Pages / AWS S3 + CloudFront CDN edge.
   - **Step 5: Automated Smoke Tests**: Synthetic probes query `/health` and `/catalog` to confirm end-to-end service availability.

---

### 2.3 Production Secrets Management

Covered in `.env.example`. In a production deployment, **zero secrets are committed to Git or baked into container images**.

#### Production Secrets Policy:
1. **Centralized Secret Store & Runtime Injection**:
   All database credentials, R2/S3 secret keys, and JWT authentication secrets are stored in **AWS Secrets Manager**, **HashiCorp Vault**, or **Doppler**. When ECS tasks or Kubernetes pods launch, secrets are resolved at container runtime via IAM task roles and secret ARNs directly into environment variables.
2. **Workload Identity Over Static Keys**:
   Instead of long-lived static AWS/R2 Access Keys, the backend assumes temporary, scoped IAM credentials via **AWS IAM Roles for Service Accounts (IRSA)** or Cloudflare scoped API tokens restricted solely to `ObjectRead` and `ObjectWrite` on the designated bucket.
3. **Automated Secret Rotation & Least Privilege**:
   Database passwords and application signing keys undergo automated 90-day rotation via AWS Secrets Manager rotation Lambdas utilizing a dual-secret grace period to avoid downtime. Developers have zero direct read access to production secrets.

---

### 2.4 Health Endpoint & The #1 Metric to Alert On

#### The `/health` Endpoint Design:
Located at `GET /health`, it performs comprehensive liveness and readiness verification:
```json
{
  "api": "healthy",
  "database": "healthy",
  "storage": "healthy",
  "catalog_published": true,
  "catalog_published_at": "2026-09-08T08:05:20.246897+00:00",
  "catalog_shows": 7,
  "timestamp": 1789142922.69
}
```
- **Database probe**: Executes `SELECT 1` against the database connection pool.
- **Storage probe**: Writes an ephemeral canary byte to `catalog/.healthcheck` to ensure the storage backend (local disk or R2) has write/read permissions.
- **Catalogue status**: Reads the published `catalogue.json` and reports timestamp and show count.
- Returns **HTTP 200 OK** when healthy, or **HTTP 503 Service Unavailable** if a core dependency is down.

#### The #1 Metric to Alert On: `CatalogAvailabilityAndFreshness`
> **Alert Condition**: If `GET /catalog` returns non-200 (or `catalog_published == false` or latency > 500ms) for **2 consecutive evaluations (60 seconds)** → Trigger **PagerDuty P1 Critical Alert**.

#### Operational Reasoning:
In the Peblo TV architecture, the platform is decoupled into a write-path (CMS/Postgres) and a read-path (Viewer/Catalogue Storage).
- If the **Database or CMS fails**, content editors cannot publish new episodes for an hour. That is a **P2/P3** operational inconvenience during business hours.
- However, if the **published catalogue in Storage becomes missing, corrupted, or unreachable**, **100% of children and viewers immediately encounter a broken application / blank screen**.
- Because the viewer UI reads exclusively from storage, `CatalogAvailabilityAndFreshness` is the single highest-impact metric governing customer experience, SLA compliance, and viewer retention.

---

## 3. Part E — Architectural Decisions & Trade-Offs

### 1. Atomic Publishing: Preventing Partial Reads
- **Implementation**: The publish operation builds the entire catalogue in-memory, writes it to a temporary file (`catalogue.json.<uuid>.tmp`), and performs an atomic rename via `os.replace` (on local filesystem) or an atomic multi-part copy (on Cloudflare R2).
- **Process Failure Mid-Publish**: If the process crashes, loses power, or is killed mid-write:
  1. The temporary file is abandoned or cleaned up on next run.
  2. The live `catalogue.json` remains completely untouched and intact.
  3. Readers never observe an empty, truncated, or half-serialized JSON file.

### 2. Storage Abstraction Layer
- Built behind an abstract base class `StorageBackend` (`backend/app/storage/base.py`).
- Implementations: `LocalStorageBackend` (disk) and `R2StorageBackend` (Cloudflare R2 / AWS S3 via `boto3`).
- **Moving to Cloudflare R2**: Zero application code changes required. The engineer simply sets `STORAGE_BACKEND=r2` and supplies the R2 endpoint and credentials in `.env`.

### 3. Search Implementation & Scale Limits
- **Current Approach**: Structured SQL query matching show titles, episode titles, categories, and language across joined normalized tables.
- **Scale Limits**: Works efficiently up to ~10,000–50,000 episodes with proper b-tree indexes. Beyond that, table scan overhead and wildcard `%q%` matches degrade database CPU.
- **Next Evolution**: Move catalogue search to a dedicated search engine (**Meilisearch** or **PostgreSQL Full-Text Search with GIN indexes** on `tsvector`), or pre-build an inverted search index during the atomic publish job.

### 4. Pre-Published Catalogue File vs Database Queries per Request
- **Why Pre-Published**: Extreme performance and massive cost reduction. The catalogue file is static JSON cached on Cloudflare CDN edge nodes. Sub-10ms response times globally with zero database load. If the database suffers downtime, viewers experience zero interruption.
- **Where It Bites**:
  1. **Freshness Lag**: Edits in the CMS do not appear instantly until an explicit publish run is triggered.
  2. **Payload Size**: At tens of thousands of shows, a single monolithic `catalogue.json` file grows too large for mobile networks. At scale, this would be partitioned by section or paginated.

### 5. Seed Data Deliberate Imperfections Handled
The raw seed dataset contained deliberate data integrity errors surfaced by our validation report:
1. **Show without Section**: `Rhyme Rangers` lacked a mandatory section attribute (preventing publish).
2. **Episode without Duration**: `ep_9001` had null duration (cannot be published).
3. **Episodes without Artwork**: `ep_0036`, `ep_0093`, `ep_0094` were marked published without complete artwork assets.
4. **Duplicate Content Group / Language**: Surface-checked to guarantee unique `(content_group, language)` tuples.

---

## 4. Test Verification Summary

```
======================== 21 passed in 4.63s ========================
- Artwork validation (aspect ratio, dimension tolerances, 200KB ceiling): PASS
- Show / Season / Episode CRUD & constraints: PASS
- Publisher atomicity & language group collapsing: PASS
- Role-based access control (editor vs admin): PASS
- Composable search (q, category, language, section): PASS
- Storage abstraction (local vs cloud): PASS
- Validation report & pre-publish integrity checks: PASS
```
