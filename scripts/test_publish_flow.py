from backend.app.db.session import SessionLocal
from backend.app.models.show import Show
from backend.app.models.episode import Episode
from backend.app.services.publisher import compile_and_publish_catalog
from backend.app.storage import get_storage

def run_test():
    db = SessionLocal()
    rhyme = db.query(Show).filter(Show.title == 'Rhyme Rangers').first()
    ep_9001 = db.query(Episode).filter(Episode.id == 'ep_9001').first()
    ep_issues = [db.query(Episode).filter(Episode.id == eid).first() for eid in ['ep_0036', 'ep_0093', 'ep_0094']]

    try:
        # Temporarily resolve issues
        if rhyme:
            rhyme.section = 'songs'
        if ep_9001:
            ep_9001.status = 'draft'
        for ep in ep_issues:
            if ep:
                ep.status = 'draft'
        db.commit()

        # Publish
        res = compile_and_publish_catalog(db, triggered_by='admin_verifier')
        print("Publish result:", res)

        # Inspect catalogue
        storage = get_storage()
        cat = storage.read_json("catalog/catalogue.json")
        assert cat is not None, "Catalog file not found!"

        shows_count = cat["counts"]["shows"]
        episodes_count = cat["counts"]["episodes"]
        print(f"Catalog stats: {shows_count} shows, {episodes_count} episodes")

        # Verify sections
        section_ids = [s["section_id"] for s in cat["sections"]]
        print("Sections generated:", section_ids)

        # Verify content_group language collapsing
        moti = next(s for sec in cat["sections"] for s in sec["shows"] if s["title"] == "Moti's Many Lives")
        s1_eps = moti["seasons"][0]["episodes"]
        ep1 = s1_eps[0]
        print(f"Collapsed ep 1: title='{ep1['title']}', languages={ep1['languages']}, variants={len(ep1['variants'])}")
        assert "en" in ep1["languages"] and "hi" in ep1["languages"], "Failed to collapse languages!"
        assert len(ep1["variants"]) == 2, "Expected 2 variants (en, hi)!"

        # Verify Season 0 trailers isolation
        season_numbers = [s["season_number"] for s in moti["seasons"]]
        print("Seasons list in regular seasons:", season_numbers)
        assert 0 not in season_numbers, "Season 0 must NOT be in regular seasons list!"

        print("=== PUBLISHER VERIFICATION SUCCESSFUL! ===")

    finally:
        # Revert back to raw seed data to keep deliberate imperfections intact
        if rhyme:
            rhyme.section = None
        if ep_9001:
            ep_9001.status = 'published'
        for ep in ep_issues:
            if ep:
                ep.status = 'published'
        db.commit()
        db.close()

if __name__ == "__main__":
    run_test()
