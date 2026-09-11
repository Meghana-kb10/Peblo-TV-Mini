import pytest
from backend.app.storage import get_storage
from backend.app.models.publish_run import PublishRun

@pytest.fixture
def mock_published_catalog(db_session, test_storage):
    run_id = "search-catalogue-run"
    db_session.add(PublishRun(
        id=run_id,
        triggered_by="test_admin",
        status="success",
        show_count=2,
        episode_count=3,
        duration_ms=1,
        catalogue_path="catalog/catalogue.json",
    ))
    db_session.commit()

    catalog_data = {
        "catalogue_version": "1.0.0",
        "publish_run_id": run_id,
        "sections": [
            {
                "section_id": "featured",
                "title": "Featured",
                "shows": [
                    {
                        "id": "show_1",
                        "title": "Moti's Many Lives",
                        "section": "featured",
                        "categories": ["adventure", "india"],
                        "trailers": [{"title": "Moti Trailer", "language": "en"}],
                        "seasons": [
                            {
                                "season_number": 1,
                                "episodes": [
                                    {"title": "The Lost Kite", "languages": ["en", "hi"]},
                                    {"title": "Rain on the Roof", "languages": ["en"]}
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "section_id": "songs",
                "title": "Songs",
                "shows": [
                    {
                        "id": "show_2",
                        "title": "Peblo Songs",
                        "section": "songs",
                        "categories": ["music", "singalong"],
                        "trailers": [],
                        "seasons": [
                            {
                                "season_number": 1,
                                "episodes": [
                                    {"title": "Alphabet Fun", "languages": ["en"]}
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
    test_storage.atomic_write_json(catalog_data, "catalog/catalogue.json")
    return catalog_data

def test_search_by_show_title(client, mock_published_catalog):
    resp = client.get("/catalog/search?q=Moti")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_matches"] == 1
    assert data["results"][0]["title"] == "Moti's Many Lives"

def test_search_by_episode_title(client, mock_published_catalog):
    resp = client.get("/catalog/search?q=Alphabet")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_matches"] == 1
    assert data["results"][0]["title"] == "Peblo Songs"

def test_search_by_category(client, mock_published_catalog):
    resp = client.get("/catalog/search?category=singalong")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_matches"] == 1
    assert data["results"][0]["title"] == "Peblo Songs"

def test_search_composable_filters(client, mock_published_catalog):
    # Matches Moti (language hi + section featured)
    resp = client.get("/catalog/search?language=hi&section=featured")
    assert resp.status_code == 200
    assert resp.json()["total_matches"] == 1

    # Songs section has NO 'hi' language -> should return 0 matches
    resp = client.get("/catalog/search?language=hi&section=songs")
    assert resp.status_code == 200
    assert resp.json()["total_matches"] == 0
