"""
Testes de integração dos endpoints REST via FastAPI TestClient.
O banco PostgreSQL é substituído por SQLite in-memory (fixture `client` do conftest).
"""

import pytest


class TestTemplateEndpoint:
    """GET /api/v1/projects/template — download da planilha modelo."""

    def test_template_returns_200(self, client):
        response = client.get("/api/v1/projects/template")
        assert response.status_code == 200

    def test_template_content_type_is_csv(self, client):
        response = client.get("/api/v1/projects/template")
        assert "text/csv" in response.headers["content-type"]

    def test_template_has_content_disposition_attachment(self, client):
        response = client.get("/api/v1/projects/template")
        disposition = response.headers.get("content-disposition", "")
        assert "attachment" in disposition


class TestUEVsEndpoint:
    """GET /api/v1/uevs — listagem de transformidades."""

    def test_list_uevs_returns_200(self, client):
        response = client.get("/api/v1/uevs")
        assert response.status_code == 200

    def test_list_uevs_returns_empty_list_on_clean_db(self, client):
        response = client.get("/api/v1/uevs")
        assert response.json() == []

    def test_list_uevs_response_is_a_list(self, client):
        response = client.get("/api/v1/uevs")
        assert isinstance(response.json(), list)
