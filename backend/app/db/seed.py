import json
import os
import shutil
from pathlib import Path
from PIL import Image
from backend.app.core.config import settings
from backend.app.db.session import SessionLocal, init_db
from backend.app.models.show import Show
from backend.app.models.season import Season
from backend.app.models.episode import Episode
from backend.app.models.artwork import Artwork

def seed_database(force: bool = False):
    """
    Ingests seed_shows.json into the database.
    Idempotent: skips if database already contains shows unless force=True.
    """
    init_db()
    db = SessionLocal()

    try:
        existing_shows_count = db.query(Show).count()
        if existing_shows_count > 0 and not force:
            print(f"[Seed] Database already contains {existing_shows_count} shows. Skipping seed.")
            return

        if force:
            print("[Seed] Force re-seeding: clearing existing data...")
            db.query(Artwork).delete()
            db.query(Episode).delete()
            db.query(Season).delete()
            db.query(Show).delete()
            db.commit()

        seed_file = Path(settings.SEED_PATH)
        if not seed_file.exists():
            print(f"[Seed] Error: Seed file {seed_file} does not exist.")
            return

        with open(seed_file, "r", encoding="utf-8") as f:
            episodes_data = json.load(f)

        print(f"[Seed] Ingesting {len(episodes_data)} episode rows from {seed_file}...")

        # Setup storage directory for artwork assets
        storage_artwork_dir = Path(settings.STORAGE_DIR) / "artwork"
        storage_artwork_dir.mkdir(parents=True, exist_ok=True)

        base_dir = Path(settings.REFERENCE_PATH).parent
        sample_assets = {
            "poster": base_dir / "poster_good.jpg",
            "banner": base_dir / "banner_good.jpg",
            "thumbnail": base_dir / "thumb_good.jpg"
        }

        # Cache asset metadata
        asset_meta = {}
        for art_type, src_path in sample_assets.items():
            if src_path.exists():
                dest_path = storage_artwork_dir / f"default_{art_type}{src_path.suffix}"
                shutil.copyfile(src_path, dest_path)
                with Image.open(src_path) as im:
                    w, h = im.size
                    ratio = round(w / h, 4)
                    size = os.path.getsize(src_path)
                    asset_meta[art_type] = {
                        "storage_path": f"artwork/{dest_path.name}",
                        "url": f"/static/artwork/{dest_path.name}",
                        "width": w,
                        "height": h,
                        "file_size_bytes": size,
                        "aspect_ratio": ratio
                    }

        # Track shows and seasons by slug/key to prevent duplicates
        shows_cache = {}
        seasons_cache = {}

        for row in episodes_data:
            slug = row["slug"]
            if slug not in shows_cache:
                show = Show(
                    slug=slug,
                    title=row["show_title"],
                    section=row.get("section"),  # preserves None for Rhyme Rangers!
                    categories=row.get("categories", []),
                    synopsis=row.get("synopsis", ""),
                    status="published"
                )
                db.add(show)
                db.flush()
                shows_cache[slug] = show

                # Create show-level artwork if available
                for art_type in ["poster", "banner"]:
                    if art_type in asset_meta:
                        meta = asset_meta[art_type]
                        show_art = Artwork(
                            show_id=show.id,
                            artwork_type=art_type,
                            storage_path=meta["storage_path"],
                            url=meta["url"],
                            width=meta["width"],
                            height=meta["height"],
                            file_size_bytes=meta["file_size_bytes"],
                            aspect_ratio=meta["aspect_ratio"]
                        )
                        db.add(show_art)

            show = shows_cache[slug]

            # Season grouping
            season_num = row["season_number"]
            season_key = (show.id, season_num)
            if season_key not in seasons_cache:
                title = "Trailers" if season_num == 0 else f"Season {season_num}"
                season = Season(
                    show_id=show.id,
                    season_number=season_num,
                    title=title
                )
                db.add(season)
                db.flush()
                seasons_cache[season_key] = season

            season = seasons_cache[season_key]

            # Episode insertion
            ep = Episode(
                id=row["episode_id"],
                season_id=season.id,
                episode_number=row["episode_number"],
                episode_title=row["episode_title"],
                duration_seconds=row.get("duration_seconds"),
                language=row["language"],
                content_group=row["content_group"],
                status=row.get("status", "published")
            )
            db.add(ep)
            db.flush()

            # Episode artwork
            available_art = row.get("artwork_available", [])
            for art_type in available_art:
                if art_type in asset_meta:
                    meta = asset_meta[art_type]
                    ep_art = Artwork(
                        episode_id=ep.id,
                        artwork_type=art_type,
                        storage_path=meta["storage_path"],
                        url=meta["url"],
                        width=meta["width"],
                        height=meta["height"],
                        file_size_bytes=meta["file_size_bytes"],
                        aspect_ratio=meta["aspect_ratio"]
                    )
                    db.add(ep_art)

        db.commit()
        print(f"[Seed] Successfully seeded {len(shows_cache)} shows, {len(seasons_cache)} seasons, and {len(episodes_data)} episodes!")

    except Exception as e:
        db.rollback()
        print(f"[Seed] Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database(force=True)
