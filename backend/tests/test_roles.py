import pytest

def test_editor_cannot_publish(client):
    # Requesting publish with X-User-Role: editor
    response = client.post("/admin/catalog/publish", headers={"X-User-Role": "editor"})
    assert response.status_code == 403
    data = response.json()
    assert "Permission denied" in data["detail"]
    assert "admin role" in data["detail"]

def test_admin_can_access_publish(client):
    # Requesting publish with X-User-Role: admin (fails on validation if issues exist, but NOT on 403)
    response = client.post("/admin/catalog/publish", headers={"X-User-Role": "admin"})
    assert response.status_code != 403

def test_editor_can_access_crud(client):
    response = client.get("/admin/shows", headers={"X-User-Role": "editor"})
    assert response.status_code == 200
    
    response = client.get("/admin/validation-report", headers={"X-User-Role": "editor"})
    assert response.status_code == 200
