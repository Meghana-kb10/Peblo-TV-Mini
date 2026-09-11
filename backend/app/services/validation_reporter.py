import json
from pathlib import Path
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.models.show import Show
from backend.app.models.episode import Episode
from backend.app.models.artwork import Artwork

REQUIRED_EPISODE_ARTWORK = {"poster", "banner", "thumbnail"}

def load_reference() -> dict:
    ref_path = Path(settings.REFERENCE_PATH)
    if ref_path.exists():
        with open(ref_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "sections": ["featured", "series", "minisodes", "songs"],
        "categories": [],
        "languages": ["en", "hi"]
    }

def generate_validation_report(db: Session) -> Dict[str, Any]:
    """
    Scans the database and generates a comprehensive validation report
    identifying everything currently blocking publish, formatted so an
    editor can fix each issue without asking an engineer.
    """
    ref = load_reference()
    allowed_sections = set(ref.get("sections", []))

    blockers: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    # 1. Check Shows
    shows = db.query(Show).all()
    shows_by_id = {s.id: s for s in shows}

    for show in shows:
        if show.status == "published":
            if not show.section:
                blockers.append({
                    "entity_type": "show",
                    "entity_id": show.id,
                    "title": show.title,
                    "issue_type": "missing_section",
                    "severity": "critical",
                    "message": f"Show '{show.title}' has status 'published' but has no section assigned.",
                    "resolution": f"Assign a section in the CMS show editor ({', '.join(allowed_sections)})."
                })
            elif show.section not in allowed_sections:
                blockers.append({
                    "entity_type": "show",
                    "entity_id": show.id,
                    "title": show.title,
                    "issue_type": "invalid_section",
                    "severity": "critical",
                    "message": f"Show '{show.title}' has invalid section '{show.section}'.",
                    "resolution": f"Must be one of: {', '.join(allowed_sections)}."
                })

    # 2. Check Episodes & Artwork
    episodes = db.query(Episode).all()
    
    # Pre-fetch artwork per episode
    artworks = db.query(Artwork).filter(Artwork.episode_id.isnot(None)).all()
    ep_artwork_map: Dict[str, set] = {}
    for a in artworks:
        ep_artwork_map.setdefault(a.episode_id, set()).add(a.artwork_type)

    for ep in episodes:
        show = ep.season.show if ep.season else None
        show_title = show.title if show else "Unknown"

        # If episode or parent show is published, validate publication criteria
        if ep.status == "published":
            # Duration check
            if not ep.duration_seconds or ep.duration_seconds <= 0:
                blockers.append({
                    "entity_type": "episode",
                    "entity_id": ep.id,
                    "show_id": show.id if show else None,
                    "show_title": show_title,
                    "title": ep.episode_title,
                    "season_number": ep.season.season_number if ep.season else None,
                    "episode_number": ep.episode_number,
                    "issue_type": "missing_duration",
                    "severity": "critical",
                    "message": f"Episode '{ep.episode_title}' ({ep.id}) in show '{show_title}' has no valid duration.",
                    "resolution": "Enter duration in seconds (must be greater than 0)."
                })

            # Artwork check
            available_art = ep_artwork_map.get(ep.id, set())
            missing_art = REQUIRED_EPISODE_ARTWORK - available_art
            if missing_art:
                blockers.append({
                    "entity_type": "episode",
                    "entity_id": ep.id,
                    "show_id": show.id if show else None,
                    "show_title": show_title,
                    "title": ep.episode_title,
                    "season_number": ep.season.season_number if ep.season else None,
                    "episode_number": ep.episode_number,
                    "issue_type": "missing_artwork",
                    "severity": "critical",
                    "message": f"Episode '{ep.episode_title}' ({ep.id}) in show '{show_title}' is missing artwork: {', '.join(sorted(missing_art))}.",
                    "resolution": f"Upload missing artwork slots: {', '.join(sorted(missing_art))}."
                })

    # 3. Check for Duplicate (content_group, language) among published episodes
    cg_lang_map: Dict[tuple, List[Episode]] = {}
    for ep in episodes:
        if ep.status == "published":
            key = (ep.content_group, ep.language)
            cg_lang_map.setdefault(key, []).append(ep)

    for (cg, lang), eps in cg_lang_map.items():
        if len(eps) > 1:
            ep_ids = [e.id for e in eps]
            show_titles = list(set([e.season.show.title for e in eps if e.season and e.season.show]))
            blockers.append({
                "entity_type": "content_group",
                "entity_id": cg,
                "language": lang,
                "issue_type": "duplicate_content_group_language",
                "severity": "critical",
                "message": f"Published content group '{cg}' has multiple '{lang}' variants: episodes {', '.join(ep_ids)} (in show: {', '.join(show_titles)}).",
                "resolution": "Each (content_group, language) must be unique. Unpublish or delete duplicate episodes."
            })

    # Group blockers by show for UI presentation
    grouped_by_show: Dict[str, List[Dict[str, Any]]] = {}
    for b in blockers:
        s_title = b.get("show_title") or "Global / Integrity"
        grouped_by_show.setdefault(s_title, []).append(b)

    is_publishable = len(blockers) == 0

    return {
        "is_publishable": is_publishable,
        "total_issues": len(blockers) + len(warnings),
        "blocking_count": len(blockers),
        "warning_count": len(warnings),
        "blockers": blockers,
        "warnings": warnings,
        "grouped_by_show": grouped_by_show,
        "summary": (
            "Catalogue is ready to publish."
            if is_publishable
            else f"Publishing is blocked by {len(blockers)} unresolved issue(s)."
        )
    }
