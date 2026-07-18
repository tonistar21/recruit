def login(client, email="admin@recruit.example.com", password="DemoAdmin123!"):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password, "remember_me": True})
    assert response.status_code == 200, response.text
    return response


def csrf(client):
    return {"X-CSRF-Token": client.cookies.get("csrf_token")}


def test_health(client):
    assert client.get("/api/v1/health").json() == {"status": "ok"}


def test_login_me_logout(client):
    login(client)
    assert client.get("/api/v1/auth/me").json()["role"] == "admin"
    assert client.post("/api/v1/auth/logout", headers=csrf(client)).status_code == 200
    assert client.get("/api/v1/auth/me").status_code == 401


def test_operator_cannot_manage_users(client):
    login(client, "operator@recruit.example.com")
    assert client.get("/api/v1/users").status_code == 403


def test_candidates_are_paginated(client):
    login(client)
    response = client.get("/api/v1/candidates?page=1&page_size=2")
    assert response.status_code == 200
    assert response.json()["total"] >= 5
    assert len(response.json()["items"]) == 2


def test_candidate_object_access(client):
    login(client, "candidate1@recruit.example.com")
    own = client.get("/api/v1/candidates?page_size=10").json()
    assert own["total"] == 1


def test_csrf_required(client):
    login(client)
    response = client.post("/api/v1/candidates", json={})
    assert response.status_code == 403


def test_login_rate_limit_returns_429_and_retry_after(client):
    for _ in range(10):
        response = client.post("/api/v1/auth/login", json={"email": "missing@recruit.example.com", "password": "WrongPassword!", "remember_me": False})
        assert response.status_code == 401
    limited = client.post("/api/v1/auth/login", json={"email": "missing@recruit.example.com", "password": "WrongPassword!", "remember_me": False})
    assert limited.status_code == 429
    assert int(limited.headers["Retry-After"]) > 0


def test_permission_change_affects_real_api_access(client):
    login(client, "operator@recruit.example.com")
    assert client.get("/api/v1/analytics/dashboard").status_code == 403
    client.post("/api/v1/auth/logout", headers=csrf(client))

    login(client)
    roles = client.get("/api/v1/roles").json()
    operator = next(role for role in roles if role["code"] == "operator")
    permissions = [*operator["permissions"], "analytics.read"]
    changed = client.put("/api/v1/roles/operator/permissions", json={"permissions": permissions}, headers=csrf(client))
    assert changed.status_code == 200, changed.text
    client.post("/api/v1/auth/logout", headers=csrf(client))

    login(client, "operator@recruit.example.com")
    assert client.get("/api/v1/analytics/dashboard").status_code == 200


def test_system_settings_are_persisted(client):
    login(client)
    payload = {
        "system_name": "Рекрут+ Тест",
        "max_upload_mb": 7,
        "allowed_mime_types": ["application/pdf", "image/png"],
        "access_token_minutes": 20,
        "max_login_attempts": 6,
        "lockout_minutes": 10,
    }
    response = client.put("/api/v1/settings/system", json=payload, headers=csrf(client))
    assert response.status_code == 200, response.text
    saved = client.get("/api/v1/settings/system").json()
    assert saved["max_upload_mb"] == 7
    assert saved["allowed_mime_types"] == ["application/pdf", "image/png"]


def test_candidate_crud_duplicate_comments_tags_archive_and_delete(client):
    login(client)
    payload = {"first_name": "Тест", "last_name": "Кандидат", "email": "unique.candidate@example.com", "phone": "+380991234999", "city": "Київ", "create_account": False}
    created = client.post("/api/v1/candidates", json=payload, headers=csrf(client))
    assert created.status_code == 201, created.text
    candidate_id = created.json()["id"]
    assert client.post("/api/v1/candidates", json=payload, headers=csrf(client)).status_code == 409
    updated = client.patch(f"/api/v1/candidates/{candidate_id}", json={"speciality": "Тестування ПЗ"}, headers=csrf(client))
    assert updated.status_code == 200
    assert updated.json()["speciality"] == "Тестування ПЗ"
    assert client.post(f"/api/v1/candidates/{candidate_id}/comments", json={"body": "Перевірений коментар"}, headers=csrf(client)).status_code == 201
    assert len(client.get(f"/api/v1/candidates/{candidate_id}/comments").json()) == 1
    tags = client.put(f"/api/v1/candidates/{candidate_id}/tags", json={"tags": ["QA", "Пріоритет"]}, headers=csrf(client))
    assert tags.status_code == 200
    assert sorted(tags.json()["tags"]) == ["qa", "пріоритет"]
    assert client.post(f"/api/v1/candidates/{candidate_id}/archive", headers=csrf(client)).status_code == 200
    assert client.post(f"/api/v1/candidates/{candidate_id}/restore", headers=csrf(client)).status_code == 200
    assert client.delete(f"/api/v1/candidates/{candidate_id}", headers=csrf(client)).status_code == 409
    client.post(f"/api/v1/candidates/{candidate_id}/archive", headers=csrf(client))
    assert client.delete(f"/api/v1/candidates/{candidate_id}", headers=csrf(client)).status_code == 204


def test_document_upload_review_download_history_delete(client, tmp_path, monkeypatch):
    from app.api.v1 import documents
    monkeypatch.setattr(documents.settings, "storage_path", tmp_path)
    login(client)
    candidate_id = client.get("/api/v1/candidates?page_size=1").json()["items"][0]["id"]
    uploaded = client.post("/api/v1/documents", data={"candidate_id": candidate_id, "category": "resume"}, files={"file": ("resume.txt", b"demo resume", "text/plain")}, headers=csrf(client))
    assert uploaded.status_code == 201, uploaded.text
    document_id = uploaded.json()["id"]
    review = client.patch(f"/api/v1/documents/{document_id}/review", json={"status": "verified", "comment": "Перевірено"}, headers=csrf(client))
    assert review.status_code == 200
    assert review.json()["status"] == "verified"
    assert len(client.get(f"/api/v1/documents/{document_id}/history").json()) == 2
    download = client.get(f"/api/v1/documents/{document_id}/download")
    assert download.content == b"demo resume"
    assert client.delete(f"/api/v1/documents/{document_id}", headers=csrf(client)).status_code == 204
    assert client.get(f"/api/v1/documents/{document_id}/download").status_code == 404


def test_interview_lifecycle_analytics_and_search(client):
    login(client)
    candidate = client.get("/api/v1/candidates?page_size=1").json()["items"][0]
    created = client.post("/api/v1/interviews", json={"candidate_id": candidate["id"], "starts_at": "2030-01-20T10:00:00Z", "duration_minutes": 45, "format": "online", "meeting_url": "https://example.test/room", "participant_ids": []}, headers=csrf(client))
    assert created.status_code == 201, created.text
    interview_id = created.json()["id"]
    updated = client.patch(f"/api/v1/interviews/{interview_id}", json={"status": "completed", "result": "recommended", "score": 9}, headers=csrf(client))
    assert updated.status_code == 200
    assert updated.json()["score"] == 9
    analytics = client.get("/api/v1/analytics")
    assert analytics.status_code == 200
    assert analytics.json()["total"] >= 1
    search = client.get(f"/api/v1/search?q={candidate['last_name']}")
    assert search.status_code == 200
    assert any(item["id"] == candidate["id"] for item in search.json())


def test_user_create_block_unblock_and_password_reset(client):
    login(client)
    created = client.post("/api/v1/users", json={"email": "new.operator@example.com", "display_name": "Новий оператор", "role_code": "operator", "temporary_password": "SecureDemo123!"}, headers=csrf(client))
    assert created.status_code == 201, created.text
    user_id = created.json()["id"]
    assert client.post(f"/api/v1/users/{user_id}/block", headers=csrf(client)).status_code == 200
    assert client.post(f"/api/v1/users/{user_id}/unblock", headers=csrf(client)).status_code == 200
    reset = client.post(f"/api/v1/users/{user_id}/reset-password", headers=csrf(client))
    assert reset.status_code == 200
    assert reset.json()["temporary_password"] == "Temporary123!"
