import pytest
from backend.app.models.show import Show
from backend.app.models.season import Season
from backend.app.models.episode import Episode
from backend.app.models.artwork import Artwork
from backend.app.services.publisher import compile_and_publish_catalog
from backend.app.storage import get_storage

def create_mock_published_show(db):
    # Create valid published show
    show = Show(
        slug="test-adventures",
        title="Test Adventures",
        section="featured",
        categories=["adventure", "friendship"],
        synopsis="A wonderful adventure.",
        status="published"
    )
    db.add(show)
    db.flush()

    # Show artwork
    show_poster = Artwork(show_id=show.id, artwork_type="poster", storage_path="artwork/poster.jpg", url="/static/poster.jpg", width=600, height=900, file_size_bytes=9000, aspect_ratio=0.667)
    show_banner = Artwork(show_id=show.id, artwork_type="banner", storage_path="artwork/banner.jpg", url="/static/banner.jpg", width=1280, height=720, file_size_bytes=14000, aspect_ratio=1.778)
    db.add_all([show_poster, show_banner])

    # Season 0 (Trailer)
    s0 = Season(show_id=show.id, season_number=0, title="Trailers")
    db.add(s0)
    db.flush()
    trailer_ep = Episode(id="ep_tr1", season_id=s0.id, episode_number=1, episode_title="Official Trailer", duration_seconds=60, language="en", content_group="test-adv-s00e01", status="published")
    db.add(trailer_ep)
    db.flush()
    db.add_all([
        Artwork(episode_id=trailer_ep.id, artwork_type="poster", storage_path="artwork/p.jpg", url="/p.jpg", width=600, height=900, file_size_bytes=9000, aspect_ratio=0.667),
        Artwork(episode_id=trailer_ep.id, artwork_type="banner", storage_path="artwork/b.jpg", url="/b.jpg", width=1280, height=720, file_size_bytes=14000, aspect_ratio=1.778),
        Artwork(episode_id=trailer_ep.id, artwork_type="thumbnail", storage_path="artwork/t.jpg", url="/t.jpg", width=640, height=360, file_size_bytes=4000, aspect_ratio=1.778),
    ])

    # Season 1 (Regular episodes with multilingual content_group)
    s1 = Season(show_id=show.id, season_number=1, title="Season 1")
    db.add(s1)
    db.flush()

    # Episode 1 - English variant
    ep1_en = Episode(id="ep_1_en", season_id=s1.id, episode_number=1, episode_title="Beginning", duration_seconds=500, language="en", content_group="cg_ep1", status="published")
    # Episode 1 - Hindi variant (SAME content_group)
    ep1_hi = Episode(id="ep_1_hi", season_id=s1.id, episode_number=1, episode_title="Beginning (Hindi)", duration_seconds=490, language="hi", content_group="cg_ep1", status="published")
    db.add_all([ep1_en, ep1_hi])
    db.flush()

    for ep in [ep1_en, ep1_hi]:
        db.add_all([
            Artwork(episode_id=ep.id, artwork_type="poster", storage_path="artwork/p.jpg", url="/p.jpg", width=600, height=900, file_size_bytes=9000, aspect_ratio=0.667),
            Artwork(episode_id=ep.id, artwork_type="banner", storage_path="artwork/b.jpg", url="/b.jpg", width=1280, height=720, file_size_bytes=14000, aspect_ratio=1.778),
            Artwork(episode_id=ep.id, artwork_type="thumbnail", storage_path="artwork/t.jpg", url="/t.jpg", width=640, height=360, file_size_bytes=4000, aspect_ratio=1.778),
        ])

    db.commit()
    return show

def test_atomic_publish_and_collapsing(db_session, test_storage):
    create_mock_published_show(db_session)

    # Execute publish
    result = compile_and_publish_catalog(db_session, triggered_by="test_admin")
    assert result["success"] is True
    assert result["show_count"] == 1
    assert result["episode_count"] == 3  # 1 trailer + 2 multilingual variants

    # Read catalogue from storage
    storage = get_storage()
    catalog = storage.read_json("catalog/catalogue.json")
    assert catalog is not None
    assert catalog["publish_run_id"] == result["run_id"]

    # Check sections
    featured = next(s for s in catalog["sections"] if s["section_id"] == "featured")
    assert len(featured["shows"]) == 1
    show_entry = featured["shows"][0]

    # Verify Season 0 trailers isolation
    assert len(show_entry["trailers"]) == 1
    assert show_entry["trailers"][0]["title"] == "Official Trailer"

    # Verify Season 0 is NOT in regular seasons
    reg_seasons = show_entry["seasons"]
    assert len(reg_seasons) == 1
    assert reg_seasons[0]["season_number"] == 1

    # Verify content_group language collapsing
    episodes = reg_seasons[0]["episodes"]
    assert len(episodes) == 1  # Collapsed into 1 catalogue entry!
    collapsed = episodes[0]
    assert collapsed["content_group"] == "cg_ep1"
    assert "en" in collapsed["languages"] and "hi" in collapsed["languages"]
    assert len(collapsed["variants"]) == 2

def test_blocked_publish_records_failed_run(db_session, test_storage):
    from backend.app.models.publish_run import PublishRun
    from backend.app.services.publisher import PublishingError

    # Create an invalid show (status published, but section is None)
    show_bad = Show(
        slug="blocked-show",
        title="Blocked Show",
        section=None,
        status="published"
    )
    db_session.add(show_bad)
    db_session.commit()

    # Attempt publish - must raise PublishingError
    with pytest.raises(PublishingError) as exc:
        compile_and_publish_catalog(db_session, triggered_by="audit_admin")
    assert "blocking validation issue" in str(exc.value)

    # Verify a failed run was recorded in publish_runs
    failed_run = db_session.query(PublishRun).filter(PublishRun.triggered_by == "audit_admin").first()
    assert failed_run is not None
    assert failed_run.status == "failed"
    assert "Publish blocked" in failed_run.error_details

