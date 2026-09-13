from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok():
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is True
    assert isinstance(body["engines"], list)
    assert "plain" in body["engines"]


def test_version():
    res = client.get("/version")
    assert res.status_code == 200
    body = res.json()
    assert "version" in body
    assert isinstance(body["engines"], list)
