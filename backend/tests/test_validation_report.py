import pytest
from backend.app.models.show import Show
from backend.app.models.season import Season
from backend.app.models.episode import Episode
from backend.app.models.artwork import Artwork
from backend.app.services.validation_reporter import generate_validation_report

def test_validation_report_catches_all_blockers(db_session):
    # 1. Show without section
    show_no_sec = Show(slug="no-sec-show", title="No Section Show", section=None, status="published")
    db_session.add(show_no_sec)
    db_session.flush()

    s1 = Season(show_id=show_no_sec.id, season_number=1, title="Season 1")
    db_session.add(s1)
    db_session.flush()

    # 2. Episode missing duration
    ep_no_dur = Episode(id="ep_bad_dur", season_id=s1.id, episode_number=1, episode_title="Bad Dur", duration_seconds=0, language="en", content_group="cg_dur", status="published")
    # 3. Episode missing artwork
    ep_no_art = Episode(id="ep_bad_art", season_id=s1.id, episode_number=2, episode_title="Bad Art", duration_seconds=300, language="en", content_group="cg_art", status="published")
    # 4. Duplicate (content_group, language)
    ep_dup1 = Episode(id="ep_dup1", season_id=s1.id, episode_number=3, episode_title="Dup 1", duration_seconds=300, language="hi", content_group="cg_dup", status="published")
    ep_dup2 = Episode(id="ep_dup2", season_id=s1.id, episode_number=4, episode_title="Dup 2", duration_seconds=300, language="hi", content_group="cg_dup", status="published")

    db_session.add_all([ep_no_dur, ep_no_art, ep_dup1, ep_dup2])
    db_session.commit()

    report = generate_validation_report(db_session)
    assert report["is_publishable"] is False

    issue_types = [b["issue_type"] for b in report["blockers"]]
    assert "missing_section" in issue_types
    assert "missing_duration" in issue_types
    assert "missing_artwork" in issue_types
    assert "duplicate_content_group_language" in issue_types
