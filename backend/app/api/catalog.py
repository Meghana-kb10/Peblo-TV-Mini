from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.services.catalog_state import load_current_catalogue
from backend.app.storage import get_storage

router = APIRouter(prefix="/catalog", tags=["Viewer Catalog"])

@router.get("")
@router.get("/")
def get_published_catalog(response: Response, db: Session = Depends(get_db)):
    """
    Public endpoint serving the atomic published catalogue file. A small
    publish-run lookup prevents a stale storage object from being treated as
    the catalogue for a replacement database.
    """
    storage = get_storage()
    catalog_data, reason = load_current_catalogue(db, storage)
    if not catalog_data:
        raise HTTPException(
            status_code=404,
            detail=f"{reason} Please ask an admin to publish."
        )

    # Set cache-friendly headers
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    return catalog_data

@router.get("/search")
def search_catalog(
    q: Optional[str] = Query(None, description="Matches show title, episode title, and categories"),
    category: Optional[str] = Query(None, description="Filter by category"),
    language: Optional[str] = Query(None, description="Filter by language variant (e.g. en, hi)"),
    section: Optional[str] = Query(None, description="Filter by section (e.g. featured, series)"),
    db: Session = Depends(get_db)
):
    """
    Searches the published catalogue with composable filters:
    - q: case-insensitive match on show title AND episode title AND category
    - category, language, section: compose seamlessly
    """
    storage = get_storage()
    catalog_data, reason = load_current_catalogue(db, storage)
    if not catalog_data:
        raise HTTPException(status_code=404, detail=reason)

    # Flatten all shows from all sections
    all_shows: List[Dict[str, Any]] = []
    for sec in catalog_data.get("sections", []):
        all_shows.extend(sec.get("shows", []))

    clean_q = q.strip().lower() if q else None
    clean_cat = category.strip().lower() if category else None
    clean_lang = language.strip().lower() if language else None
    clean_sec = section.strip().lower() if section else None

    matched_shows: List[Dict[str, Any]] = []

    for show in all_shows:
        # Filter 1: Section
        if clean_sec and show.get("section", "").lower() != clean_sec:
            continue

        # Filter 2: Category
        show_cats = [c.lower() for c in show.get("categories", [])]
        if clean_cat and clean_cat not in show_cats:
            continue

        # Filter 3: Language
        # Show matches if any regular episode or trailer supports the language
        if clean_lang:
            has_lang = False
            for season in show.get("seasons", []):
                for ep in season.get("episodes", []):
                    if clean_lang in [l.lower() for l in ep.get("languages", [])]:
                        has_lang = True
                        break
                if has_lang:
                    break
            if not has_lang:
                for tr in show.get("trailers", []):
                    if tr.get("language", "").lower() == clean_lang:
                        has_lang = True
                        break
            if not has_lang:
                continue

        # Filter 4: Query q matching show title AND episode title AND categories
        if clean_q:
            title_match = clean_q in show.get("title", "").lower()
            cat_match = any(clean_q in c for c in show_cats)
            ep_match = False
            for season in show.get("seasons", []):
                for ep in season.get("episodes", []):
                    if clean_q in ep.get("title", "").lower():
                        ep_match = True
                        break
                if ep_match:
                    break
            if not ep_match:
                for tr in show.get("trailers", []):
                    if clean_q in tr.get("title", "").lower():
                        ep_match = True
                        break

            if not (title_match or cat_match or ep_match):
                continue

        matched_shows.append(show)

    return {
        "query": q,
        "filters": {
            "category": category,
            "language": language,
            "section": section
        },
        "total_matches": len(matched_shows),
        "results": matched_shows
    }
