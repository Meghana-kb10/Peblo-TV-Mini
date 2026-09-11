import json
from collections import Counter
from pathlib import Path

from backend.app.models.show import Show
from backend.app.models.season import Season
from backend.app.models.episode import Episode
from backend.app.models.artwork import Artwork
from backend.app.services.validation_reporter import generate_validation_report


def seed_challenge_data(db_session):
    """Load the supplied seed without sanitising its intentional errors."""
    seed_path = Path(__file__).resolve().parents[2] / "seed_shows.json"
    rows = json.loads(seed_path.read_text(encoding="utf-8"))

    shows = {}
    seasons = {}
    for row in rows:
        show = shows.get(row["slug"])
        if show is None:
            show = Show(
                slug=row["slug"],
                title=row["show_title"],
                section=row.get("section"),
                categories=row.get("categories", []),
                synopsis=row.get("synopsis", ""),
                status="published",
            )
            db_session.add(show)
            db_session.flush()
            shows[row["slug"]] = show

        season_key = (show.id, row["season_number"])
        season = seasons.get(season_key)
        if season is None:
            season = Season(
                show_id=show.id,
                season_number=row["season_number"],
                title="Trailers" if row["season_number"] == 0 else f"Season {row['season_number']}",
            )
            db_session.add(season)
            db_session.flush()
            seasons[season_key] = season

        episode = Episode(
            id=row["episode_id"],
            season_id=season.id,
            episode_number=row["episode_number"],
            episode_title=row["episode_title"],
            duration_seconds=row.get("duration_seconds"),
            language=row["language"],
            content_group=row["content_group"],
            status=row.get("status", "published"),
        )
        db_session.add(episode)
        db_session.flush()

        for artwork_type in row.get("artwork_available", []):
            db_session.add(Artwork(
                episode_id=episode.id,
                artwork_type=artwork_type,
                storage_path=f"artwork/{episode.id}-{artwork_type}.jpg",
                url=f"/static/artwork/{episode.id}-{artwork_type}.jpg",
                width=600,
                height=900,
                file_size_bytes=1024,
                aspect_ratio=2 / 3,
            ))

    db_session.commit()

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


def test_validation_report_surfaces_every_deliberate_seed_blocker(db_session):
    seed_challenge_data(db_session)

    report = generate_validation_report(db_session)
    issue_counts = Counter(issue["issue_type"] for issue in report["blockers"])

    assert report["is_publishable"] is False
    assert report["blocking_count"] == 5
    assert issue_counts == {
        "missing_section": 1,
        "missing_artwork": 3,
        "duplicate_content_group_language": 1,
    }

    missing_artwork_ids = {
        issue["entity_id"]
        for issue in report["blockers"]
        if issue["issue_type"] == "missing_artwork"
    }
    assert missing_artwork_ids == {"ep_0036", "ep_0093", "ep_0094"}

    duplicate = next(
        issue
        for issue in report["blockers"]
        if issue["issue_type"] == "duplicate_content_group_language"
    )
    assert duplicate["entity_id"] == "motis-many-lives-s01e02"
    assert duplicate["language"] == "hi"


def test_resolve_seed_blockers_endpoint(db_session):
    seed_challenge_data(db_session)
    report_before = generate_validation_report(db_session)
    assert report_before["is_publishable"] is False
    assert report_before["blocking_count"] == 5

    from backend.app.api.admin import resolve_seed_blockers
    from backend.app.api.auth import User
    admin_user = User(username="admin_user", role="admin")
    result = resolve_seed_blockers(db=db_session, user=admin_user)
    assert result["success"] is True
    assert result["is_publishable"] is True
    assert result["blocking_count"] == 0

    report_after = generate_validation_report(db_session)
    assert report_after["is_publishable"] is True
    assert report_after["blocking_count"] == 0
