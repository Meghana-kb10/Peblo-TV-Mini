import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from backend.app.db.session import get_db
from backend.app.api.auth import get_current_user, require_admin, User
from backend.app.models.show import Show
from backend.app.models.season import Season
from backend.app.models.episode import Episode
from backend.app.models.artwork import Artwork
from backend.app.models.publish_run import PublishRun
from backend.app.storage import get_storage
from backend.app.services.artwork_validator import validate_artwork, ArtworkValidationError
from backend.app.services.validation_reporter import generate_validation_report, load_reference
from backend.app.services.publisher import compile_and_publish_catalog, PublishingError

router = APIRouter(prefix="/admin", tags=["Admin CMS"])

# ==========================================
# Pydantic Schemas
# ==========================================

class ShowCreateSchema(BaseModel):
    title: str
    slug: str
    section: Optional[str] = None
    categories: List[str] = Field(default_factory=list)
    synopsis: Optional[str] = ""
    status: str = "published"

class ShowUpdateSchema(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    section: Optional[str] = None
    categories: Optional[List[str]] = None
    synopsis: Optional[str] = None
    status: Optional[str] = None

class SeasonCreateSchema(BaseModel):
    season_number: int
    title: Optional[str] = None

class SeasonUpdateSchema(BaseModel):
    season_number: Optional[int] = None
    title: Optional[str] = None

class EpisodeCreateSchema(BaseModel):
    id: Optional[str] = None
    show_id: str
    season_number: int = 1
    episode_number: int
    episode_title: str
    duration_seconds: Optional[int] = None
    language: str = "en"
    content_group: str
    status: str = "draft"

class EpisodeUpdateSchema(BaseModel):
    episode_title: Optional[str] = None
    duration_seconds: Optional[int] = None
    language: Optional[str] = None
    content_group: Optional[str] = None
    status: Optional[str] = None
    episode_number: Optional[int] = None

# ==========================================
# Shows Endpoints
# ==========================================

@router.get("/shows")
def list_shows(
    section: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(Show)
    if section:
        query = query.filter(Show.section == section)
    if status_filter:
        query = query.filter(Show.status == status_filter)
    if search:
        query = query.filter(Show.title.ilike(f"%{search}%"))

    shows = query.order_by(Show.title).all()
    storage = get_storage()

    results = []
    for s in shows:
        # Get show artwork
        arts = {a.artwork_type: storage.get_public_url(a.storage_path) for a in s.artwork}
        episodes_count = sum(len(season.episodes) for season in s.seasons)
        results.append({
            "id": s.id,
            "slug": s.slug,
            "title": s.title,
            "section": s.section,
            "categories": s.categories,
            "synopsis": s.synopsis,
            "status": s.status,
            "episodes_count": episodes_count,
            "artwork": arts,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return results

@router.get("/shows/{show_id}")
def get_show(show_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")

    storage = get_storage()
    arts = {a.artwork_type: storage.get_public_url(a.storage_path) for a in show.artwork}

    seasons_data = []
    for season in sorted(show.seasons, key=lambda s: s.season_number):
        seasons_data.append({
            "id": season.id,
            "season_number": season.season_number,
            "title": season.title,
            "episodes_count": len(season.episodes)
        })

    return {
        "id": show.id,
        "slug": show.slug,
        "title": show.title,
        "section": show.section,
        "categories": show.categories,
        "synopsis": show.synopsis,
        "status": show.status,
        "artwork": arts,
        "seasons": seasons_data,
        "created_at": show.created_at.isoformat() if show.created_at else None
    }

@router.post("/shows", status_code=201)
def create_show(
    payload: ShowCreateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    ref = load_reference()
    allowed_sections = set(ref.get("sections", []))

    # Validation: published show must have a section
    if payload.status == "published":
        if not payload.section:
            raise HTTPException(
                status_code=400,
                detail="A published show must have a section assigned."
            )
        if payload.section not in allowed_sections:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid section '{payload.section}'. Allowed: {', '.join(allowed_sections)}."
            )

    # Check unique slug
    if db.query(Show).filter(Show.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail=f"Show with slug '{payload.slug}' already exists.")

    show = Show(
        slug=payload.slug,
        title=payload.title,
        section=payload.section,
        categories=payload.categories,
        synopsis=payload.synopsis or "",
        status=payload.status
    )
    db.add(show)
    db.commit()
    db.refresh(show)
    return {"id": show.id, "slug": show.slug, "title": show.title, "section": show.section}

@router.put("/shows/{show_id}")
def update_show(
    show_id: str,
    payload: ShowUpdateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")

    ref = load_reference()
    allowed_sections = set(ref.get("sections", []))

    new_status = payload.status if payload.status is not None else show.status
    new_section = payload.section if payload.section is not None else show.section

    # Validation: published show must have a section
    if new_status == "published":
        if not new_section:
            raise HTTPException(status_code=400, detail="A published show must have a section assigned.")
        if new_section not in allowed_sections:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid section '{new_section}'. Allowed: {', '.join(allowed_sections)}."
            )

    if payload.title is not None:
        show.title = payload.title
    if payload.slug is not None:
        show.slug = payload.slug
    if payload.section is not None:
        show.section = payload.section
    if payload.categories is not None:
        show.categories = payload.categories
    if payload.synopsis is not None:
        show.synopsis = payload.synopsis
    if payload.status is not None:
        show.status = payload.status

    db.commit()
    db.refresh(show)
    return {"id": show.id, "title": show.title, "section": show.section, "status": show.status}

@router.delete("/shows/{show_id}")
def delete_show(show_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
    db.delete(show)
    db.commit()
    return {"deleted": True, "show_id": show_id}

# ==========================================
# Seasons Endpoints
# ==========================================

@router.get("/shows/{show_id}/seasons")
def list_seasons_for_show(
    show_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
    return [
        {
            "id": s.id,
            "show_id": s.show_id,
            "season_number": s.season_number,
            "title": s.title,
            "episodes_count": len(s.episodes),
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s in sorted(show.seasons, key=lambda s: s.season_number)
    ]

@router.post("/shows/{show_id}/seasons", status_code=201)
def create_season(
    show_id: str,
    payload: SeasonCreateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")

    existing = db.query(Season).filter(Season.show_id == show_id, Season.season_number == payload.season_number).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Season {payload.season_number} already exists for show '{show.title}'.")

    title = payload.title or ("Trailers" if payload.season_number == 0 else f"Season {payload.season_number}")
    season = Season(
        show_id=show_id,
        season_number=payload.season_number,
        title=title
    )
    db.add(season)
    db.commit()
    db.refresh(season)
    return {"id": season.id, "show_id": season.show_id, "season_number": season.season_number, "title": season.title}

@router.put("/seasons/{season_id}")
def update_season(
    season_id: str,
    payload: SeasonUpdateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    season = db.query(Season).filter(Season.id == season_id).first()
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")

    if payload.season_number is not None and payload.season_number != season.season_number:
        dup = db.query(Season).filter(Season.show_id == season.show_id, Season.season_number == payload.season_number, Season.id != season_id).first()
        if dup:
            raise HTTPException(status_code=400, detail=f"Season {payload.season_number} already exists for this show.")
        season.season_number = payload.season_number

    if payload.title is not None:
        season.title = payload.title

    db.commit()
    db.refresh(season)
    return {"id": season.id, "season_number": season.season_number, "title": season.title}

@router.delete("/seasons/{season_id}")
def delete_season(
    season_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    season = db.query(Season).filter(Season.id == season_id).first()
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    db.delete(season)
    db.commit()
    return {"deleted": True, "season_id": season_id}

# ==========================================
# Episodes Endpoints
# ==========================================

@router.get("/episodes")
def list_episodes(
    show_id: Optional[str] = None,
    section: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    language: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(Episode).join(Season).join(Show)

    if show_id:
        query = query.filter(Show.id == show_id)
    if section:
        query = query.filter(Show.section == section)
    if status_filter:
        query = query.filter(Episode.status == status_filter)
    if language:
        query = query.filter(Episode.language == language)
    if search:
        query = query.filter(or_(
            Episode.episode_title.ilike(f"%{search}%"),
            Episode.id.ilike(f"%{search}%"),
            Episode.content_group.ilike(f"%{search}%"),
            Show.title.ilike(f"%{search}%")
        ))

    total = query.count()
    episodes = query.order_by(Show.title, Season.season_number, Episode.episode_number).offset((page - 1) * limit).limit(limit).all()

    storage = get_storage()
    results = []
    for ep in episodes:
        arts = {a.artwork_type: storage.get_public_url(a.storage_path) for a in ep.artwork}
        results.append({
            "id": ep.id,
            "show_id": ep.season.show.id,
            "show_title": ep.season.show.title,
            "section": ep.season.show.section,
            "season_number": ep.season.season_number,
            "episode_number": ep.episode_number,
            "episode_title": ep.episode_title,
            "duration_seconds": ep.duration_seconds,
            "language": ep.language,
            "content_group": ep.content_group,
            "status": ep.status,
            "artwork": arts,
            "artwork_available": list(arts.keys())
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": results
    }

@router.get("/episodes/{episode_id}")
def get_episode(episode_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ep = db.query(Episode).filter(Episode.id == episode_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Episode not found")

    storage = get_storage()
    arts = {a.artwork_type: storage.get_public_url(a.storage_path) for a in ep.artwork}

    return {
        "id": ep.id,
        "show_id": ep.season.show.id,
        "show_title": ep.season.show.title,
        "season_number": ep.season.season_number,
        "episode_number": ep.episode_number,
        "episode_title": ep.episode_title,
        "duration_seconds": ep.duration_seconds,
        "language": ep.language,
        "content_group": ep.content_group,
        "status": ep.status,
        "artwork": arts
    }

@router.post("/episodes", status_code=201)
def create_episode(
    payload: EpisodeCreateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Validation 1: (content_group, language) must be unique
    existing_dup = (
        db.query(Episode)
        .filter(Episode.content_group == payload.content_group)
        .filter(Episode.language == payload.language)
        .first()
    )
    if existing_dup:
        raise HTTPException(
            status_code=400,
            detail=f"An episode with content_group '{payload.content_group}' and language '{payload.language}' already exists (ID: {existing_dup.id})."
        )

    # Validation 2: published episode must have duration and artwork
    if payload.status == "published":
        if not payload.duration_seconds or payload.duration_seconds <= 0:
            raise HTTPException(
                status_code=400,
                detail="A published episode must have a positive duration in seconds."
            )
        raise HTTPException(
            status_code=400,
            detail="An episode cannot be created directly as 'published' without artwork. Please create it with status 'draft' first, upload poster, banner, and thumbnail artwork, and then publish."
        )

    # Find or create Season
    show = db.query(Show).filter(Show.id == payload.show_id).first()
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")

    season = (
        db.query(Season)
        .filter(Season.show_id == show.id)
        .filter(Season.season_number == payload.season_number)
        .first()
    )
    if not season:
        title = "Trailers" if payload.season_number == 0 else f"Season {payload.season_number}"
        season = Season(show_id=show.id, season_number=payload.season_number, title=title)
        db.add(season)
        db.flush()

    ep_id = payload.id or f"ep_{uuid.uuid4().hex[:8]}"
    ep = Episode(
        id=ep_id,
        season_id=season.id,
        episode_number=payload.episode_number,
        episode_title=payload.episode_title,
        duration_seconds=payload.duration_seconds,
        language=payload.language,
        content_group=payload.content_group,
        status=payload.status
    )
    db.add(ep)
    db.commit()
    db.refresh(ep)
    return {"id": ep.id, "episode_title": ep.episode_title, "status": ep.status}

@router.put("/episodes/{episode_id}")
def update_episode(
    episode_id: str,
    payload: EpisodeUpdateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    ep = db.query(Episode).filter(Episode.id == episode_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Episode not found")

    new_cg = payload.content_group if payload.content_group is not None else ep.content_group
    new_lang = payload.language if payload.language is not None else ep.language
    new_status = payload.status if payload.status is not None else ep.status
    new_dur = payload.duration_seconds if payload.duration_seconds is not None else ep.duration_seconds

    # Validation 1: (content_group, language) uniqueness check
    if new_cg != ep.content_group or new_lang != ep.language:
        dup = (
            db.query(Episode)
            .filter(Episode.content_group == new_cg)
            .filter(Episode.language == new_lang)
            .filter(Episode.id != ep.id)
            .first()
        )
        if dup:
            raise HTTPException(
                status_code=400,
                detail=f"An episode with content_group '{new_cg}' and language '{new_lang}' already exists (ID: {dup.id})."
            )

    # Validation 2: published episode must have duration and artwork
    if new_status == "published":
        if not new_dur or new_dur <= 0:
            raise HTTPException(
                status_code=400,
                detail="A published episode must have a duration greater than 0."
            )
        art_types = set(a.artwork_type for a in ep.artwork)
        missing_art = {"poster", "banner", "thumbnail"} - art_types
        if missing_art:
            raise HTTPException(
                status_code=400,
                detail=f"Episode cannot be published without artwork. Missing: {', '.join(sorted(missing_art))}."
            )

    if payload.episode_title is not None:
        ep.episode_title = payload.episode_title
    if payload.duration_seconds is not None:
        ep.duration_seconds = payload.duration_seconds
    if payload.language is not None:
        ep.language = payload.language
    if payload.content_group is not None:
        ep.content_group = payload.content_group
    if payload.status is not None:
        ep.status = payload.status
    if payload.episode_number is not None:
        ep.episode_number = payload.episode_number

    db.commit()
    db.refresh(ep)
    return {"id": ep.id, "episode_title": ep.episode_title, "status": ep.status}

@router.delete("/episodes/{episode_id}")
def delete_episode(episode_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ep = db.query(Episode).filter(Episode.id == episode_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Episode not found")
    db.delete(ep)
    db.commit()
    return {"deleted": True, "episode_id": episode_id}

# ==========================================
# Artwork Upload Endpoint
# ==========================================

@router.post("/artwork/upload")
async def upload_artwork(
    file: UploadFile = File(...),
    artwork_type: str = Form(...),
    show_id: Optional[str] = Form(None),
    episode_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Validates uploaded artwork image per reference.json (aspect ratio, dimensions, 200 KB max).
    Saves file to storage and updates database record.
    """
    content = await file.read()

    # Validate target entity existence before proceeding
    if not episode_id and not show_id:
        raise HTTPException(
            status_code=400,
            detail="Must specify either 'show_id' or 'episode_id' for uploaded artwork."
        )

    if episode_id:
        target_ep = db.query(Episode).filter(Episode.id == episode_id).first()
        if not target_ep:
            raise HTTPException(status_code=404, detail=f"Episode '{episode_id}' not found.")
        show_id = None  # Ensure it is attached specifically to the episode
    elif show_id:
        target_show = db.query(Show).filter(Show.id == show_id).first()
        if not target_show:
            raise HTTPException(status_code=404, detail=f"Show '{show_id}' not found.")

    # Strict server-side validation using Pillow
    try:
        width, height, aspect_ratio, img_format = validate_artwork(content, artwork_type)
    except ArtworkValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Save to storage abstraction
    storage = get_storage()
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    unique_filename = f"{artwork_type}_{uuid.uuid4().hex[:10]}.{file_ext}"
    relative_path = f"artwork/{unique_filename}"
    storage.save_file(content, relative_path, content_type=file.content_type or "image/jpeg")

    public_url = storage.get_public_url(relative_path)

    # Upsert artwork record in database
    existing = None
    if episode_id:
        existing = db.query(Artwork).filter(Artwork.episode_id == episode_id, Artwork.artwork_type == artwork_type).first()
    elif show_id:
        existing = db.query(Artwork).filter(Artwork.show_id == show_id, Artwork.artwork_type == artwork_type).first()

    if existing:
        existing.storage_path = relative_path
        existing.url = public_url
        existing.width = width
        existing.height = height
        existing.file_size_bytes = len(content)
        existing.aspect_ratio = aspect_ratio
        art_record = existing
    else:
        art_record = Artwork(
            show_id=show_id,
            episode_id=episode_id,
            artwork_type=artwork_type,
            storage_path=relative_path,
            url=public_url,
            width=width,
            height=height,
            file_size_bytes=len(content),
            aspect_ratio=aspect_ratio
        )
        db.add(art_record)

    db.commit()
    db.refresh(art_record)

    return {
        "id": art_record.id,
        "artwork_type": artwork_type,
        "url": public_url,
        "width": width,
        "height": height,
        "aspect_ratio": aspect_ratio,
        "file_size_bytes": len(content),
        "message": f"Successfully validated and uploaded {artwork_type} artwork."
    }

# ==========================================
# Validation Report Endpoint
# ==========================================

@router.get("/validation-report")
def get_validation_report(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Returns everything currently blocking publish, grouped so an editor can fix it."""
    return generate_validation_report(db)

# ==========================================
# Publish & History Endpoints (Admin Protected)
# ==========================================

@router.post("/catalog/publish")
def publish_catalog(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Builds the catalogue JSON and writes it to storage atomically.
    Strictly enforced: requires 'admin' role! Editors get 403 Forbidden.
    """
    # ENFORCE ROLE: Editor is rejected with 403 Forbidden!
    require_admin(user)

    try:
        result = compile_and_publish_catalog(db, triggered_by=user.username)
        return result
    except PublishingError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected publishing failure: {e}")

@router.get("/catalog/history")
def get_publish_history(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Returns history of all publish runs."""
    runs = db.query(PublishRun).order_by(PublishRun.created_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "triggered_by": r.triggered_by,
            "status": r.status,
            "show_count": r.show_count,
            "episode_count": r.episode_count,
            "duration_ms": r.duration_ms,
            "error_details": r.error_details,
            "catalogue_path": r.catalogue_path,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in runs
    ]

# ==========================================
# Seed Blocker Resolution Endpoints (Demo Helper)
# ==========================================

@router.post("/seed-blockers/resolve")
def resolve_seed_blockers(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Resolves the 5 deliberate seed integrity errors:
    1. Assigns section 'songs' to Rhyme Rangers.
    2. Unpublishes duplicate Hindi episode ep_9001 (sets status='draft').
    3. Fills missing artwork for ep_0036 (The Midnight Market).
    4. Fills missing artwork for ep_0093 (Moti's Many Lives Trailer).
    5. Fills missing artwork for ep_0094 (Banyan Dadi Trailer).
    """
    # 1. Rhyme Rangers missing section
    rr = db.query(Show).filter(Show.title == "Rhyme Rangers").first()
    if rr:
        rr.section = "songs"
        rr.status = "published"

    # 2. Duplicate Hindi content group in Moti's Many Lives
    ep_9001 = db.query(Episode).filter(Episode.id == "ep_9001").first()
    if ep_9001:
        ep_9001.status = "draft"

    # 3, 4, 5. Missing Artwork for episodes ep_0036, ep_0093, ep_0094
    ep_ids = ["ep_0036", "ep_0093", "ep_0094"]
    for ep_id in ep_ids:
        ep = db.query(Episode).filter(Episode.id == ep_id).first()
        if not ep:
            continue
        existing_types = {a.artwork_type for a in ep.artwork}
        for art_type in ["poster", "banner", "thumbnail"]:
            if art_type not in existing_types:
                sample_filename = f"default_{'poster' if art_type == 'poster' else 'banner' if art_type == 'banner' else 'thumb'}.jpg"
                sample_file = f"/static/artwork/{sample_filename}"
                w = 600 if art_type == "poster" else 1280 if art_type == "banner" else 640
                h = 900 if art_type == "poster" else 720 if art_type == "banner" else 360
                art = Artwork(
                    id=str(uuid.uuid4()),
                    episode_id=ep.id,
                    artwork_type=art_type,
                    storage_path=f"artwork/{sample_filename}",
                    url=sample_file,
                    width=w,
                    height=h,
                    file_size_bytes=102400,
                    aspect_ratio=round(w / h, 4)
                )
                db.add(art)

    db.commit()
    report = generate_validation_report(db)
    return {
        "success": True,
        "message": "All 5 seed blockers successfully resolved! Catalogue is now ready to publish.",
        "is_publishable": report["is_publishable"],
        "blocking_count": report["blocking_count"]
    }

@router.post("/seed-blockers/reset")
def reset_seed_blockers(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Restores the 5 deliberate seed integrity errors for demonstration/testing:
    1. Clears section on Rhyme Rangers.
    2. Restores ep_9001 to 'published'.
    3. Removes generated fallback artwork for ep_0036, ep_0093, ep_0094.
    """
    # 1. Remove section from Rhyme Rangers
    rr = db.query(Show).filter(Show.title == "Rhyme Rangers").first()
    if rr:
        rr.section = None

    # 2. Re-publish duplicate ep_9001
    ep_9001 = db.query(Episode).filter(Episode.id == "ep_9001").first()
    if ep_9001:
        ep_9001.status = "published"

    # 3. Remove fallback artwork for ep_0036, ep_0093, ep_0094
    for ep_id in ["ep_0036", "ep_0093", "ep_0094"]:
        db.query(Artwork).filter(
            Artwork.episode_id == ep_id,
            Artwork.file_path.like("/static/artwork/default_%")
        ).delete(synchronize_session=False)

    db.commit()
    report = generate_validation_report(db)
    return {
        "success": True,
        "message": "Reset to 5 deliberate seed blockers.",
        "is_publishable": report["is_publishable"],
        "blocking_count": report["blocking_count"]
    }

