import time
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.show import Show
from backend.app.models.season import Season
from backend.app.models.episode import Episode
from backend.app.models.artwork import Artwork
from backend.app.models.publish_run import PublishRun
from backend.app.storage import get_storage
from backend.app.services.validation_reporter import generate_validation_report, load_reference

class PublishingError(Exception):
    """Raised when publication cannot proceed due to integrity violations."""
    pass

def compile_and_publish_catalog(db: Session, triggered_by: str = "admin") -> Dict[str, Any]:
    """
    Builds the published catalogue JSON and writes it to storage atomically.
    Enforces all publish rules:
    - Only published shows with valid sections appear
    - Only published episodes with duration and complete artwork appear
    - content_group variants collapse into one entry with a sorted languages list
    - Season 0 is isolated as trailers (never treated as a normal season)
    - Grouped by section in deterministic order
    - Atomic write guarantees no reader sees a partial catalogue
    - Logs publish run in database
    """
    start_time = time.time()
    run_id = str(uuid.uuid4())
    storage = get_storage()
    ref = load_reference()
    allowed_sections = ref.get("sections", ["featured", "series", "minisodes", "songs"])

    # 1. Enforce pre-publish validation
    report = generate_validation_report(db)
    if not report["is_publishable"]:
        duration_ms = int((time.time() - start_time) * 1000)
        error_msg = f"Publish blocked by {report['blocking_count']} issue(s)."
        
        # Log failed run in audit log
        failed_run = PublishRun(
            id=str(uuid.uuid4()),
            triggered_by=triggered_by,
            status="failed",
            show_count=0,
            episode_count=0,
            duration_ms=duration_ms,
            error_details=error_msg + " " + "; ".join([b["message"] for b in report["blockers"][:3]])
        )
        db.add(failed_run)
        db.commit()

        raise PublishingError(
            f"Cannot publish: {report['blocking_count']} blocking validation issue(s) exist. "
            f"Please review the validation report."
        )

    # 2. Query published shows with valid sections
    shows = (
        db.query(Show)
        .filter(Show.status == "published")
        .filter(Show.section.in_(allowed_sections))
        .all()
    )

    # Collect show artworks
    show_artworks = db.query(Artwork).filter(Artwork.show_id.isnot(None)).all()
    show_art_map: Dict[str, Dict[str, str]] = {}
    for a in show_artworks:
        show_art_map.setdefault(a.show_id, {})[a.artwork_type] = storage.get_public_url(a.storage_path)

    # Collect episode artworks
    ep_artworks = db.query(Artwork).filter(Artwork.episode_id.isnot(None)).all()
    ep_art_map: Dict[str, Dict[str, str]] = {}
    for a in ep_artworks:
        ep_art_map.setdefault(a.episode_id, {})[a.artwork_type] = storage.get_public_url(a.storage_path)

    section_shows_map: Dict[str, List[Dict[str, Any]]] = {sec: [] for sec in allowed_sections}
    total_episodes_published = 0

    for show in shows:
        show_art = show_art_map.get(show.id, {})
        
        # Process seasons
        regular_seasons_data: List[Dict[str, Any]] = []
        trailers_data: List[Dict[str, Any]] = []

        for season in sorted(show.seasons, key=lambda s: s.season_number):
            # Query only published episodes
            pub_episodes = [ep for ep in season.episodes if ep.status == "published"]
            if not pub_episodes:
                continue

            if season.season_number == 0:
                # Season 0 is reserved for trailers — isolate from regular seasons!
                for ep in sorted(pub_episodes, key=lambda e: e.episode_number):
                    trailers_data.append({
                        "episode_id": ep.id,
                        "title": ep.episode_title,
                        "duration_seconds": ep.duration_seconds,
                        "language": ep.language,
                        "artwork": ep_art_map.get(ep.id, {})
                    })
                    total_episodes_published += 1
            else:
                # Regular season: collapse content_group variants into one entry
                groups: Dict[str, List[Episode]] = {}
                for ep in sorted(pub_episodes, key=lambda e: e.episode_number):
                    groups.setdefault(ep.content_group, []).append(ep)

                collapsed_episodes: List[Dict[str, Any]] = []
                for cg, group_eps in groups.items():
                    # Sort languages deterministically (e.g. ['en', 'hi'])
                    sorted_variants = sorted(group_eps, key=lambda e: e.language)
                    primary_ep = sorted_variants[0]
                    available_languages = [e.language for e in sorted_variants]

                    collapsed_entry = {
                        "content_group": cg,
                        "episode_number": primary_ep.episode_number,
                        "title": primary_ep.episode_title,
                        "duration_seconds": primary_ep.duration_seconds,
                        "languages": available_languages,
                        "variants": [
                            {
                                "episode_id": e.id,
                                "language": e.language,
                                "title": e.episode_title,
                                "duration_seconds": e.duration_seconds,
                                "artwork": ep_art_map.get(e.id, {})
                            }
                            for e in sorted_variants
                        ],
                        # Thumbnail for episode listing surface
                        "artwork": ep_art_map.get(primary_ep.id, {})
                    }
                    collapsed_episodes.append(collapsed_entry)
                    total_episodes_published += len(group_eps)

                # Sort collapsed episodes by episode_number
                collapsed_episodes.sort(key=lambda e: e["episode_number"])

                regular_seasons_data.append({
                    "season_number": season.season_number,
                    "title": season.title or f"Season {season.season_number}",
                    "episodes": collapsed_episodes
                })

        # Compile show entry — skip shows that have zero published episodes or trailers
        if not regular_seasons_data and not trailers_data:
            continue

        show_entry = {
            "id": show.id,
            "slug": show.slug,
            "title": show.title,
            "section": show.section,
            "categories": show.categories or [],
            "synopsis": show.synopsis or "",
            "artwork": {
                "poster": show_art.get("poster"),
                "banner": show_art.get("banner")
            },
            "trailers": trailers_data,
            "seasons": regular_seasons_data
        }

        section_shows_map[show.section].append(show_entry)

    # Deterministic ordering: sort shows by title alphabetically within each section
    sections_output: List[Dict[str, Any]] = []
    total_shows_published = 0

    for sec in allowed_sections:
        sec_shows = section_shows_map.get(sec, [])
        sec_shows.sort(key=lambda s: s["title"].lower())
        total_shows_published += len(sec_shows)
        sections_output.append({
            "section_id": sec,
            "title": sec.capitalize(),
            "shows": sec_shows
        })

    catalog_data = {
        "catalogue_version": "1.0.0",
        "publish_run_id": run_id,
        "published_at": datetime.now(timezone.utc).isoformat(),
        "published_by": triggered_by,
        "counts": {
            "shows": total_shows_published,
            "episodes": total_episodes_published
        },
        "sections": sections_output
    }

    # 3. Atomic write to storage
    catalog_path = "catalog/catalogue.json"
    storage.atomic_write_json(catalog_data, catalog_path)

    # 4. Record successful publish run
    duration_ms = int((time.time() - start_time) * 1000)
    run_record = PublishRun(
        id=run_id,
        triggered_by=triggered_by,
        status="success",
        show_count=total_shows_published,
        episode_count=total_episodes_published,
        duration_ms=duration_ms,
        catalogue_path=catalog_path,
        error_details=None
    )
    db.add(run_record)
    db.commit()

    return {
        "success": True,
        "run_id": run_record.id,
        "published_at": catalog_data["published_at"],
        "show_count": total_shows_published,
        "episode_count": total_episodes_published,
        "duration_ms": duration_ms,
        "catalogue_path": catalog_path
    }
