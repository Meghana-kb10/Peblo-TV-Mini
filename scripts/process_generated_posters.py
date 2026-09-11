import os
import glob
from pathlib import Path
from PIL import Image
from backend.app.db.session import SessionLocal
from backend.app.models.show import Show
from backend.app.models.artwork import Artwork

BRAIN_DIR = Path(r"C:\Users\kbmeg\.gemini\antigravity-ide\brain\2efab91c-7889-4bbb-8c9e-600f9bc7dfa7")
STORAGE_ART_DIR = Path(__file__).resolve().parent.parent / "storage" / "artwork"
STORAGE_ART_DIR.mkdir(parents=True, exist_ok=True)

IMAGE_MAPPING = {
    "curious-cubs": "curious_cubs_poster_*.jpg",
    "discover-india-with-moti": "discover_india_poster_*.jpg",
    "motis-many-lives": "moti_many_lives_*.jpg",
    "tiny-tales-banyan-dadi": "banyan_dadi_poster_*.jpg",
    "number-nest": "number_nest_poster_*.jpg",
    "rhyme-rangers": "rhyme_rangers_poster_*.jpg",
    "peblo-songs": "peblo_songs_poster_*.jpg",
    "peblo-songs-lyrical": "peblo_lyrical_poster_*.jpg",
}

def process_artworks():
    db = SessionLocal()
    shows = db.query(Show).all()
    print(f"Processing artwork for {len(shows)} shows...")

    for show in shows:
        pattern = IMAGE_MAPPING.get(show.slug)
        if not pattern:
            print(f"Skipping {show.slug}, no pattern found")
            continue

        matches = list(BRAIN_DIR.glob(pattern))
        if not matches:
            print(f"No match for {pattern}")
            continue

        src_path = matches[0]
        print(f"Found source image for {show.title}: {src_path.name}")

        with Image.open(src_path) as img:
            img = img.convert("RGB")
            
            # 1. Generate 2:3 Poster (600x900) strictly under 190 KB
            poster_dest = STORAGE_ART_DIR / f"poster_{show.slug}.jpg"
            poster_img = img.resize((600, 900), Image.Resampling.LANCZOS)
            q = 85
            poster_img.save(poster_dest, "JPEG", quality=q, optimize=True)
            while os.path.getsize(poster_dest) > 190 * 1024 and q > 40:
                q -= 5
                poster_img.save(poster_dest, "JPEG", quality=q, optimize=True)
            poster_size = os.path.getsize(poster_dest)

            # 2. Generate 16:9 Banner (1280x720) strictly under 190 KB
            # Center crop to 16:9
            banner_dest = STORAGE_ART_DIR / f"banner_{show.slug}.jpg"
            w, h = img.size
            target_h = int(w * 9 / 16)
            if target_h <= h:
                # crop vertically in the upper-middle
                top = int((h - target_h) * 0.35)
                banner_crop = img.crop((0, top, w, top + target_h))
            else:
                target_w = int(h * 16 / 9)
                left = int((w - target_w) / 2)
                banner_crop = img.crop((left, 0, left + target_w, h))
            
            banner_resized = banner_crop.resize((1280, 720), Image.Resampling.LANCZOS)
            bq = 80
            banner_resized.save(banner_dest, "JPEG", quality=bq, optimize=True)
            while os.path.getsize(banner_dest) > 190 * 1024 and bq > 40:
                bq -= 5
                banner_resized.save(banner_dest, "JPEG", quality=bq, optimize=True)
            banner_size = os.path.getsize(banner_dest)

            # 3. Update or Create Database Artwork records
            # Poster
            poster_art = next((a for a in show.artwork if a.artwork_type == "poster"), None)
            if poster_art:
                poster_art.storage_path = f"artwork/poster_{show.slug}.jpg"
                poster_art.url = f"/static/artwork/poster_{show.slug}.jpg"
                poster_art.width = 600
                poster_art.height = 900
                poster_art.aspect_ratio = 0.6667
                poster_art.file_size_bytes = poster_size
            else:
                poster_art = Artwork(
                    show_id=show.id,
                    artwork_type="poster",
                    storage_path=f"artwork/poster_{show.slug}.jpg",
                    url=f"/static/artwork/poster_{show.slug}.jpg",
                    width=600,
                    height=900,
                    aspect_ratio=0.6667,
                    file_size_bytes=poster_size
                )
                db.add(poster_art)

            # Banner
            banner_art = next((a for a in show.artwork if a.artwork_type == "banner"), None)
            if banner_art:
                banner_art.storage_path = f"artwork/banner_{show.slug}.jpg"
                banner_art.url = f"/static/artwork/banner_{show.slug}.jpg"
                banner_art.width = 1280
                banner_art.height = 720
                banner_art.aspect_ratio = 1.7778
                banner_art.file_size_bytes = banner_size
            else:
                banner_art = Artwork(
                    show_id=show.id,
                    artwork_type="banner",
                    storage_path=f"artwork/banner_{show.slug}.jpg",
                    url=f"/static/artwork/banner_{show.slug}.jpg",
                    width=1280,
                    height=720,
                    aspect_ratio=1.7778,
                    file_size_bytes=banner_size
                )
                db.add(banner_art)

            print(f"  [SAVED] {show.title}:")
            print(f"    - Poster: /static/artwork/poster_{show.slug}.jpg ({poster_size / 1024:.1f} KB)")
            print(f"    - Banner: /static/artwork/banner_{show.slug}.jpg ({banner_size / 1024:.1f} KB)")

    db.commit()
    db.close()
    print("All posters and banners successfully processed and updated in DB!")

if __name__ == "__main__":
    process_artworks()
