def test_liveness_succeeds_without_a_catalogue_and_cleans_up_canary(client, test_storage):
    test_storage.delete_file("catalog/catalogue.json")
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["storage"] == "healthy"
    assert response.json()["catalog_published"] is False
    assert not list((test_storage.base_dir / "catalog").glob(".healthcheck-*"))


def test_readiness_requires_a_current_catalogue(client, test_storage):
    test_storage.delete_file("catalog/catalogue.json")
    response = client.get("/readyz")

    assert response.status_code == 503
    assert response.json()["catalog_published"] is False


def test_stale_catalogue_is_not_served(client, test_storage):
    test_storage.atomic_write_json(
        {"catalogue_version": "1.0.0", "publish_run_id": "missing-run"},
        "catalog/catalogue.json",
    )

    response = client.get("/catalog")

    assert response.status_code == 404
    assert "successful publish run" in response.json()["detail"]
