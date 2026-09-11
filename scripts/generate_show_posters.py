import os
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from backend.app.db.session import SessionLocal
from backend.app.models.show import Show
from backend.app.models.artwork import Artwork

STORAGE_ART_DIR = Path(__file__).resolve().parent.parent / "storage" / "artwork"
STORAGE_ART_DIR.mkdir(parents=True, exist_ok=True)

SHOW_PALETTES = {
    "curious-cubs": {
        "bg_top": (214, 150, 90),
        "bg_bot": (60, 100, 50),
        "theme": "bear",
        "accent": (245, 200, 120),
        "title": "Curious Cubs"
    },
    "discover-india-with-moti": {
        "bg_top": (230, 130, 60),
        "bg_bot": (180, 70, 40),
        "theme": "temple",
        "accent": (255, 220, 150),
        "title": "Discover India"
    },
    "moti-s-many-lives": {
        "bg_top": (60, 140, 200),
        "bg_bot": (210, 110, 60),
        "theme": "moti",
        "accent": (250, 230, 160),
        "title": "Moti's Many Lives"
    },
    "number-nest": {
        "bg_top": (240, 180, 50),
        "bg_bot": (120, 160, 70),
        "theme": "numbers",
        "accent": (255, 245, 200),
        "title": "Number Nest"
    },
    "peblo-songs": {
        "bg_top": (180, 60, 160),
        "bg_bot": (60, 40, 120),
        "theme": "music",
        "accent": (255, 180, 230),
        "title": "Peblo Songs"
    },
    "peblo-songs-lyrical": {
        "bg_top": (220, 80, 130),
        "bg_bot": (70, 50, 140),
        "theme": "notes",
        "accent": (255, 210, 230),
        "title": "Songs Lyrical"
    },
    "rhyme-rangers": {
        "bg_top": (220, 70, 60),
        "bg_bot": (40, 120, 140),
        "theme": "shield",
        "accent": (255, 230, 140),
        "title": "Rhyme Rangers"
    },
    "tiny-tales-by-banyan-dadi": {
        "bg_top": (80, 140, 100),
        "bg_bot": (40, 70, 50),
        "theme": "tree",
        "accent": (230, 215, 170),
        "title": "Tiny Tales"
    },
    "ocean-friends": {
        "bg_top": (30, 120, 190),
        "bg_bot": (10, 50, 100),
        "theme": "ocean",
        "accent": (140, 230, 255),
        "title": "Ocean Friends"
    },
    "little-explorers": {
        "bg_top": (50, 40, 90),
        "bg_bot": (15, 15, 35),
        "theme": "space",
        "accent": (180, 200, 255),
        "title": "Little Explorers"
    },
    "wild-wonders": {
        "bg_top": (220, 120, 40),
        "bg_bot": (40, 90, 45),
        "theme": "tiger",
        "accent": (255, 230, 160),
        "title": "Wild Wonders"
    }
}

def create_poster(slug: str, title: str) -> str:
    palette = SHOW_PALETTES.get(slug, {
        "bg_top": (90, 70, 130),
        "bg_bot": (40, 30, 60),
        "theme": "generic",
        "accent": (240, 220, 180),
        "title": title
    })

    # Exact 2:3 aspect ratio (600x900)
    w, h = 600, 900
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)

    # 1. Smooth vertical gradient
    r1, g1, b1 = palette["bg_top"]
    r2, g2, b2 = palette["bg_bot"]
    for y in range(h):
        factor = y / h
        r = int(r1 + (r2 - r1) * factor)
        g = int(g1 + (g2 - g1) * factor)
        b = int(b1 + (b2 - b1) * factor)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # 2. Graphic elements
    # Sun / Glow circle
    cx, cy, radius = 300, 380, 180
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=(*palette["accent"], 40))
    draw.ellipse([cx - radius + 30, cy - radius + 30, cx + radius - 30, cy + radius - 30], fill=(*palette["accent"], 70))

    # Mountains / Horizon curves
    draw.polygon([(0, 650), (180, 480), (360, 620), (600, 460), (600, 900), (0, 900)], fill=(30, 20, 15, 140))
    draw.polygon([(0, 720), (250, 560), (480, 700), (600, 580), (600, 900), (0, 900)], fill=(20, 15, 10, 200))

    # Stylized Icon / Mascot in Center
    theme = palette.get("theme")
    if theme == "bear":
        # Cute Bear silhouette / face
        draw.ellipse([220, 300, 380, 460], fill=(120, 75, 45))  # Head
        draw.ellipse([200, 280, 260, 340], fill=(100, 60, 35))  # Left Ear
        draw.ellipse([340, 280, 400, 340], fill=(100, 60, 35))  # Right Ear
        draw.ellipse([250, 370, 350, 445], fill=(220, 180, 140)) # Muzzle
        draw.ellipse([285, 385, 315, 410], fill=(40, 25, 15))    # Nose
        draw.ellipse([250, 340, 270, 360], fill=(40, 25, 15))    # Eye L
        draw.ellipse([330, 340, 350, 360], fill=(40, 25, 15))    # Eye R
    elif theme == "moti" or theme == "temple":
        # Boy / Character silhouette
        draw.ellipse([240, 280, 360, 400], fill=(180, 110, 75)) # Face
        draw.arc([230, 260, 370, 380], 180, 360, fill=(40, 25, 15), width=35) # Hair
        draw.polygon([(210, 420), (390, 420), (430, 540), (170, 540)], fill=(230, 110, 40)) # Kurta
    elif theme == "ocean":
        # Dolphin / Marine shape
        draw.ellipse([180, 320, 420, 440], fill=(80, 190, 240))
        draw.polygon([(360, 360), (450, 310), (430, 420)], fill=(60, 160, 220)) # Tail
    elif theme == "space":
        # Astronaut helmet
        draw.ellipse([210, 290, 390, 470], fill=(240, 240, 250))
        draw.ellipse([240, 330, 360, 430], fill=(30, 40, 70))
        draw.arc([250, 340, 350, 420], 210, 330, fill=(255, 215, 0), width=6)
    elif theme == "tiger":
        # Tiger face
        draw.ellipse([210, 300, 390, 480], fill=(230, 120, 30))
        draw.polygon([(200, 280), (260, 280), (230, 330)], fill=(190, 90, 20))
        draw.polygon([(340, 280), (400, 280), (370, 330)], fill=(190, 90, 20))
        draw.ellipse([250, 400, 350, 470], fill=(255, 245, 230))
        draw.polygon([(285, 410), (315, 410), (300, 430)], fill=(40, 20, 10))
    else:
        # Star / Badge
        draw.polygon([(300, 280), (330, 350), (410, 350), (345, 395), (370, 465), (300, 420), (230, 465), (255, 395), (190, 350), (270, 350)], fill=palette["accent"])

    # 3. Header badge: "PEBLO TV ORIGINAL"
    draw.rounded_rectangle([180, 45, 420, 80], radius=8, fill=(10, 8, 6, 160))
    draw.text((300, 62), "PEBLO TV ORIGINAL", fill=(240, 225, 205), anchor="mm")

    # 4. Show Title Banner at bottom
    draw.rounded_rectangle([40, 720, 560, 840], radius=16, fill=(15, 10, 8, 225))
    draw.text((300, 780), title, fill=(255, 255, 255), anchor="mm")

    filename = f"poster_{slug}.jpg"
    dest = STORAGE_ART_DIR / filename
    # Save as high-quality JPEG under 200 KB ceiling
    img.save(dest, "JPEG", quality=90, optimize=True)
    return filename

def run():
    db = SessionLocal()
    shows = db.query(Show).all()
    print(f"Generating custom posters for {len(shows)} shows...")

    for s in shows:
        filename = create_poster(s.slug, s.title)
        storage_rel = f"artwork/{filename}"
        public_url = f"/static/artwork/{filename}"
        file_bytes = os.path.getsize(STORAGE_ART_DIR / filename)

        # Update show poster
        poster = next((a for a in s.artwork if a.artwork_type == "poster"), None)
        if poster:
            poster.storage_path = storage_rel
            poster.url = public_url
            poster.width = 600
            poster.height = 900
            poster.aspect_ratio = 0.6667
            poster.file_size_bytes = file_bytes
        else:
            new_poster = Artwork(
                show_id=s.id,
                artwork_type="poster",
                storage_path=storage_rel,
                url=public_url,
                width=600,
                height=900,
                aspect_ratio=0.6667,
                file_size_bytes=file_bytes
            )
            db.add(new_poster)

        print(f"  [OK] {s.title} -> {public_url} ({file_bytes / 1024:.1f} KB)")

    db.commit()
    db.close()
    print("All custom posters generated and database updated successfully!")

if __name__ == "__main__":
    run()
