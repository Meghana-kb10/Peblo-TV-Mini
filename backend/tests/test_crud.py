import pytest
from backend.app.models.show import Show
from backend.app.models.season import Season
from backend.app.models.episode import Episode

def test_show_validation_section_required_when_published(client):
    # Attempt to create published show without section
    resp = client.post("/admin/shows", json={
        "title": "Unsectioned Show",
        "slug": "unsectioned-show",
        "status": "published"
    }, headers={"X-User-Role": "editor"})
    assert resp.status_code == 400
    assert "must have a section" in resp.json()["detail"]

    # Attempt to create published show with invalid section
    resp = client.post("/admin/shows", json={
        "title": "Invalid Section Show",
        "slug": "invalid-section-show",
        "section": "nonexistent_section",
        "status": "published"
    }, headers={"X-User-Role": "editor"})
    assert resp.status_code == 400
    assert "Invalid section" in resp.json()["detail"]

    # Valid creation succeeds
    resp = client.post("/admin/shows", json={
        "title": "Valid Show",
        "slug": "valid-show",
        "section": "featured",
        "categories": ["adventure"],
        "status": "published"
    }, headers={"X-User-Role": "editor"})
    assert resp.status_code == 201
    show_id = resp.json()["id"]

    # Get show
    resp = client.get(f"/admin/shows/{show_id}", headers={"X-User-Role": "editor"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "Valid Show"

    # Update show to draft allows removing section
    resp = client.put(f"/admin/shows/{show_id}", json={
        "status": "draft",
        "section": None
    }, headers={"X-User-Role": "editor"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "draft"

    # Delete show
    resp = client.delete(f"/admin/shows/{show_id}", headers={"X-User-Role": "editor"})
    assert resp.status_code == 200
    assert resp.json()["deleted"] is True

def test_season_crud_and_validation(client):
    # Setup a parent show
    resp = client.post("/admin/shows", json={
        "title": "Season Test Show",
        "slug": "season-test-show",
        "section": "series",
        "status": "published"
    }, headers={"X-User-Role": "editor"})
    show_id = resp.json()["id"]

    # Create Season 1
    resp = client.post(f"/admin/shows/{show_id}/seasons", json={
        "season_number": 1,
        "title": "Season One"
    }, headers={"X-User-Role": "editor"})
    assert resp.status_code == 201
    s1_id = resp.json()["id"]

    # Duplicate season number fails
    resp = client.post(f"/admin/shows/{show_id}/seasons", json={
        "season_number": 1,
        "title": "Season One Duplicate"
    }, headers={"X-User-Role": "editor"})
    assert resp.status_code == 400
    assert "already exists" in resp.json()["detail"]

    # Create Season 0 (Trailers)
    resp = client.post(f"/admin/shows/{show_id}/seasons", json={
        "season_number": 0
    }, headers={"X-User-Role": "editor"})
    assert resp.status_code == 201
    assert resp.json()["title"] == "Trailers"

    # List seasons
    resp = client.get(f"/admin/shows/{show_id}/seasons", headers={"X-User-Role": "editor"})
    assert resp.status_code == 200
    seasons = resp.json()
    assert len(seasons) == 2
    assert seasons[0]["season_number"] == 0
    assert seasons[1]["season_number"] == 1

    # Update season title
    resp = client.put(f"/admin/seasons/{s1_id}", json={
        "title": "The First Journey"
    }, headers={"X-User-Role": "editor"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "The First Journey"

    # Delete season
    resp = client.delete(f"/admin/seasons/{s1_id}", headers={"X-User-Role": "editor"})
    assert resp.status_code == 200
    assert resp.json()["deleted"] is True

def test_episode_crud_and_validations(client):
    # Setup show
    resp = client.post("/admin/shows", json={
        "title": "Episode Test Show",
        "slug": "ep-test-show",
        "section": "series",
        "status": "published"
    }, headers={"X-User-Role": "editor"})
    show_id = resp.json()["id"]

    # Validation: cannot create episode directly as published (requires artwork)
    resp = client.post("/admin/episodes", json={
        "show_id": show_id,
        "season_number": 1,
        "episode_number": 1,
        "episode_title": "Direct Published Ep",
        "duration_seconds": 300,
        "language": "en",
        "content_group": "cg_test_1",
        "status": "published"
    }, headers={"X-User-Role": "editor"})
    assert resp.status_code == 400
    assert "without artwork" in resp.json()["detail"]

    # Create episode as draft succeeds
    resp = client.post("/admin/episodes", json={
        "show_id": show_id,
        "season_number": 1,
        "episode_number": 1,
        "episode_title": "Draft Episode",
        "duration_seconds": 300,
        "language": "en",
        "content_group": "cg_test_1",
        "status": "draft"
    }, headers={"X-User-Role": "editor"})
    assert resp.status_code == 201
    ep_id = resp.json()["id"]

    # Validation: duplicate (content_group, language) rejected
    resp = client.post("/admin/episodes", json={
        "show_id": show_id,
        "season_number": 1,
        "episode_number": 2,
        "episode_title": "Duplicate Lang Ep",
        "duration_seconds": 300,
        "language": "en",
        "content_group": "cg_test_1",
        "status": "draft"
    }, headers={"X-User-Role": "editor"})
    assert resp.status_code == 400
    assert "already exists" in resp.json()["detail"]

    # Multi-language variant with same content_group but DIFFERENT language succeeds
    resp = client.post("/admin/episodes", json={
        "show_id": show_id,
        "season_number": 1,
        "episode_number": 1,
        "episode_title": "Draft Episode Hindi",
        "duration_seconds": 300,
        "language": "hi",
        "content_group": "cg_test_1",
        "status": "draft"
    }, headers={"X-User-Role": "editor"})
    assert resp.status_code == 201

    # Updating status to published without artwork fails
    resp = client.put(f"/admin/episodes/{ep_id}", json={
        "status": "published"
    }, headers={"X-User-Role": "editor"})
    assert resp.status_code == 400
    assert "Missing" in resp.json()["detail"]

    # Delete episode
    resp = client.delete(f"/admin/episodes/{ep_id}", headers={"X-User-Role": "editor"})
    assert resp.status_code == 200
    assert resp.json()["deleted"] is True
