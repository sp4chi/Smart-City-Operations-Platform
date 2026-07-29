import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.seed_data import seed_database

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    seed_database()

def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"

def test_dashboard_overview():
    res = client.get("/api/dashboard/overview")
    assert res.status_code == 200
    data = res.json()
    assert "city_health_pct" in data
    assert len(data["districts"]) == 5

def test_utilities_status_and_forecast():
    res = client.get("/api/utilities/status")
    assert res.status_code == 200
    assert len(res.json()) >= 5
    
    fc_res = client.get("/api/utilities/forecast?metric=electricity_mw&district_id=1&hours=24")
    assert fc_res.status_code == 200
    assert len(fc_res.json()["forecast"]) == 24

def test_transportation_corridors():
    res = client.get("/api/transportation/corridors")
    assert res.status_code == 200
    assert len(res.json()) >= 5

def test_public_services_311():
    res = client.get("/api/public-services/311/requests")
    assert res.status_code == 200
    assert len(res.json()) > 0

def test_infrastructure_assets():
    res = client.get("/api/infrastructure/assets")
    assert res.status_code == 200
    assert len(res.json()) > 0

def test_ai_assistant_grounded_chat():
    res = client.post("/api/ai/chat", json={"prompt": "Which districts have water anomalies?"})
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert len(data["sources"]) > 0
