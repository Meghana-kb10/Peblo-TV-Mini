import os
import glob
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw
from backend.app.db.session import SessionLocal
from backend.app.models.show import Show
from backend.app.models.episode import Episode
from backend.app.models.season import Season
from backend.app.models.artwork import Artwork

BRAIN_DIR = Path(r"C:\Users\kbmeg\.gemini\antigravity-ide\brain\2efab91c-7889-4bbb-8c9e-600f9bc7dfa7")
STORAGE_ART_DIR = Path(__file__).resolve().parent.parent / "storage" / "artwork"
STORAGE_ART_DIR.mkdir(parents=True, exist_ok=True)

def save_optimized(img: Image.Image, dest: Path, max_kb: int = 185) -> int:
    """Save image as JPEG ensuring strict file size ceiling under 185 KB (< 200 KB limit)."""
    q = 86
    img.save(dest, "JPEG", quality=q, optimize=True)
    while os.path.getsize(dest) > max_kb * 1024 and q > 35:
        q -= 5
        img.save(dest, "JPEG", quality=q, optimize=True)
    return os.path.getsize(dest)

def create_cinematic_widescreen_banner(poster_img: Image.Image) -> Image.Image:
    """
    Creates a high-end 16:9 widescreen banner (1280x720) derived from poster key art:
    - Extends the environment across the 1280px wide canvas with ambient scene blur.
    - Positions the uncropped character / hero artwork prominently on the right.
    - Blends the edges smoothly with feathered transparency.
    - Leaves clean negative space on the left for hero text legibility.
    """
    cw, ch = 1280, 720
    canvas = Image.new("RGB", (cw, ch))

    # 1. Atmospheric scene background
    bg = poster_img.resize((cw, int(cw * poster_img.height / poster_img.width)), Image.Resampling.LANCZOS)
    bg_top = max(0, (bg.height - ch) // 2)
    bg_crop = bg.crop((0, bg_top, cw, bg_top + ch))
    bg_blurred = bg_crop.filter(ImageFilter.GaussianBlur(radius=24))
    canvas.paste(bg_blurred, (0, 0))

    # 2. Main uncropped character subject on the right
    subject_w = int(ch * poster_img.width / poster_img.height) # 480 px
    subject = poster_img.resize((subject_w, ch), Image.Resampling.LANCZOS)
    x_offset = cw - subject_w - 20

    # Soft feather mask on the left edge of the subject
    mask = Image.new("L", (subject_w, ch), 255)
    draw_mask = ImageDraw.Draw(mask)
    fade_w = 90
    for x in range(fade_w):
        alpha = int(255 * (x / fade_w))
        draw_mask.line([(x, 0), (x, ch)], fill=alpha)

    canvas.paste(subject, (x_offset, 0), mask)

    # 3. Soft cinematic darkening on left for hero text readability
    vignette = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    v_draw = ImageDraw.Draw(vignette)
    for x in range(700):
        alpha = int(215 * (1 - x / 700))
        v_draw.line([(x, 0), (x, ch)], fill=(12, 13, 18, alpha))

    return Image.alpha_composite(canvas.convert("RGBA"), vignette).convert("RGB")

def run():
    print("Rebuilding posters and matching banners for all shows...")

    # Distinct source images
    moti_many_lives_src = list(BRAIN_DIR.glob("moti_dog_poster_*.jpg"))[0]
    discover_india_src = list(BRAIN_DIR.glob("discover_moti_dog_post_*.jpg"))[0]

    POSTER_SOURCES = {
        "motis-many-lives": moti_many_lives_src,
        "discover-india-with-moti": discover_india_src,
        "curious-cubs": list(BRAIN_DIR.glob("curious_cubs_poster_*.jpg"))[0],
        "tiny-tales-banyan-dadi": list(BRAIN_DIR.glob("banyan_dadi_poster_*.jpg"))[0],
        "number-nest": list(BRAIN_DIR.glob("number_nest_poster_*.jpg"))[0],
        "rhyme-rangers": list(BRAIN_DIR.glob("rhyme_rangers_poster_*.jpg"))[0],
        "peblo-songs": list(BRAIN_DIR.glob("peblo_songs_poster_*.jpg"))[0],
        "peblo-songs-lyrical": list(BRAIN_DIR.glob("peblo_lyrical_poster_*.jpg"))[0],
    }

    db = SessionLocal()
    shows = db.query(Show).all()

    for s in shows:
        poster_src_path = POSTER_SOURCES.get(s.slug)
        if not poster_src_path:
            continue

        print(f"\nProcessing {s.title} ({s.slug})...")
        poster_src_img = Image.open(poster_src_path).convert("RGB")

        # 1. Build 2:3 Poster (600x900)
        p_dest = STORAGE_ART_DIR / f"poster_{s.slug}.jpg"
        p_img = poster_src_img.resize((600, 900), Image.Resampling.LANCZOS)
        p_size = save_optimized(p_img, p_dest)
        print(f"  [POSTER] /static/artwork/poster_{s.slug}.jpg ({p_size / 1024:.1f} KB)")

        # 2. Build 16:9 Widescreen Banner (1280x720) directly derived from the poster!
        b_dest = STORAGE_ART_DIR / f"banner_{s.slug}.jpg"
        b_img = create_cinematic_widescreen_banner(poster_src_img)
        b_size = save_optimized(b_img, b_dest)
        print(f"  [BANNER] /static/artwork/banner_{s.slug}.jpg ({b_size / 1024:.1f} KB)")

        # 3. Build 16:9 Thumbnail (640x360)
        t_dest = STORAGE_ART_DIR / f"thumb_{s.slug}.jpg"
        t_img = b_img.resize((640, 360), Image.Resampling.LANCZOS)
        t_size = save_optimized(t_img, t_dest)
        print(f"  [THUMBNAIL] /static/artwork/thumb_{s.slug}.jpg ({t_size / 1024:.1f} KB)")

        # Update Show Artworks in DB
        poster_art = next((a for a in s.artwork if a.artwork_type == "poster"), None)
        if poster_art:
            poster_art.storage_path = f"artwork/poster_{s.slug}.jpg"
            poster_art.url = f"/static/artwork/poster_{s.slug}.jpg"
            poster_art.width = 600
            poster_art.height = 900
            poster_art.aspect_ratio = 0.6667
            poster_art.file_size_bytes = p_size

        banner_art = next((a for a in s.artwork if a.artwork_type == "banner"), None)
        if banner_art:
            banner_art.storage_path = f"artwork/banner_{s.slug}.jpg"
            banner_art.url = f"/static/artwork/banner_{s.slug}.jpg"
            banner_art.width = 1280
            banner_art.height = 720
            banner_art.aspect_ratio = 1.7778
            banner_art.file_size_bytes = b_size

    # Update Episodes Artwork in DB (preserve the 3 deliberate seed blockers!)
    episodes = db.query(Episode).filter(~Episode.id.in_(["ep_0036", "ep_0093", "ep_0094"])).all()
    print(f"\nUpdating {len(episodes)} episodes with matching show artwork...")
    for ep in episodes:
        season = db.query(Season).filter(Season.id == ep.season_id).first()
        if not season:
            continue
        show = db.query(Show).filter(Show.id == season.show_id).first()
        if not show:
            continue
        slug = show.slug
        for a in ep.artwork:
            if a.artwork_type == "poster":
                a.url = f"/static/artwork/poster_{slug}.jpg"
                a.storage_path = f"artwork/poster_{slug}.jpg"
                a.width = 600
                a.height = 900
                a.aspect_ratio = 0.6667
            elif a.artwork_type == "banner":
                a.url = f"/static/artwork/banner_{slug}.jpg"
                a.storage_path = f"artwork/banner_{slug}.jpg"
                a.width = 1280
                a.height = 720
                a.aspect_ratio = 1.7778
            elif a.artwork_type == "thumbnail":
                a.url = f"/static/artwork/thumb_{slug}.jpg"
                a.storage_path = f"artwork/thumb_{slug}.jpg"
                a.width = 640
                a.height = 360
                a.aspect_ratio = 1.7778

    db.commit()
    db.close()
    print("\nDatabase artwork records updated successfully!")

    # Update storage/catalog/catalogue.json
    cat_path = Path("storage/catalog/catalogue.json")
    if cat_path.exists():
        import json
        with open(cat_path, "r", encoding="utf-8") as f:
            cat_data = json.load(f)

        for sec in cat_data.get("sections", []):
            for show in sec.get("shows", []):
                slug = show.get("slug")
                show["artwork"] = {
                    "poster": f"/static/artwork/poster_{slug}.jpg",
                    "banner": f"/static/artwork/banner_{slug}.jpg"
                }
                for season in show.get("seasons", []):
                    for ep in season.get("episodes", []):
                        ep["artwork"] = {
                            "thumbnail": f"/static/artwork/thumb_{slug}.jpg",
                            "poster": f"/static/artwork/poster_{slug}.jpg",
                            "banner": f"/static/artwork/banner_{slug}.jpg"
                        }
                        for v in ep.get("variants", []):
                            v["artwork"] = {
                                "thumbnail": f"/static/artwork/thumb_{slug}.jpg"
                            }
                for tr in show.get("trailers", []):
                    tr["artwork"] = {
                        "thumbnail": f"/static/artwork/thumb_{slug}.jpg"
                    }

        with open(cat_path, "w", encoding="utf-8") as f:
            json.dump(cat_data, f, indent=2)
        print("storage/catalog/catalogue.json updated successfully with distinct Discover India & Moti's Many Lives artwork!")

if __name__ == "__main__":
    run()
