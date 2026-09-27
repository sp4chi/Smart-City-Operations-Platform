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

def test_auth_login_and_rbac():
    # 1. Admin login
    res = client.post("/api/auth/login", data={"username": "admin@citypulse.gov", "password": "admin123"})
    assert res.status_code == 200
    token_data = res.json()
    assert "access_token" in token_data
    assert token_data["role"] == "admin"

    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test /me endpoint
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "admin@citypulse.gov"

    # 3. Viewer login
    viewer_res = client.post("/api/auth/login", data={"username": "viewer@citypulse.gov", "password": "viewer123"})
    assert viewer_res.status_code == 200
    viewer_token = viewer_res.json()["access_token"]
    viewer_headers = {"Authorization": f"Bearer {viewer_token}"}

    # 4. RBAC Check: Viewer attempt write -> Blocked 403
    write_res = client.post(
        "/api/public-services/311/create",
        json={"title": "Test Pothole", "category": "Pothole Repair", "description": "Test", "district_id": 1, "lat": 30.2, "lng": -97.7},
        headers=viewer_headers
    )
    assert write_res.status_code == 403
    assert "Access denied" in write_res.json()["detail"]

    # 5. RBAC Check: Admin attempt write -> Allowed 200
    admin_write = client.post(
        "/api/public-services/311/create",
        json={"title": "Admin Pothole Report", "category": "Pothole Repair", "description": "Test", "district_id": 1, "lat": 30.2, "lng": -97.7},
        headers=headers
    )
    assert admin_write.status_code == 200
    assert "request_number" in admin_write.json()

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

def test_registration_privilege_escalation_blocked():
    # Attempting to self-register as admin should be rejected with 403 Forbidden
    res = client.post(
        "/api/auth/register",
        json={"email": "attacker@fake.gov", "full_name": "Attacker", "password": "password123", "role": "admin"}
    )
    assert res.status_code == 403
    assert "cannot be self-registered" in res.json()["detail"]

    # Registering as operator or viewer is permitted
    import time
    unique_email = f"operator_{int(time.time()*1000)}@citypulse.gov"
    valid_res = client.post(
        "/api/auth/register",
        json={"email": unique_email, "full_name": "New Operator", "password": "password123", "role": "operator"}
    )
    assert valid_res.status_code == 200
    assert valid_res.json()["role"] == "operator"

def test_resolve_alert_endpoint():
    overview = client.get("/api/dashboard/overview").json()
    if overview["recent_alerts"]:
        alert_id = overview["recent_alerts"][0]["id"]
        res = client.post(f"/api/dashboard/alerts/{alert_id}/resolve")
        assert res.status_code == 200
        assert "resolved successfully" in res.json()["message"]

def test_ai_assistant_fallback_when_offline():
    from app.core.config import settings
    orig_key = settings.GEMINI_API_KEY
    try:
        settings.GEMINI_API_KEY = ""
        res = client.post("/api/ai/chat", json={"prompt": "Summarize active critical alerts"})
        assert res.status_code == 200
        data = res.json()
        assert "answer" in data
        assert data["mode"] == "grounded_fallback"
    finally:
        settings.GEMINI_API_KEY = orig_key

def test_cors_headers_and_error_handling():
    test_origin = "https://citypulse-frontend-zxw5.onrender.com"
    # Normal request should have CORS headers
    res = client.get("/api/dashboard/overview", headers={"Origin": test_origin})
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == test_origin

    # 404/Starlette HTTPException should also have CORS headers
    not_found = client.get("/api/nonexistent-route", headers={"Origin": test_origin})
    assert not_found.status_code == 404
    assert not_found.headers.get("access-control-allow-origin") == test_origin

def test_emergency_unit_dispatch_and_recall():
    units = client.get("/api/public-services/emergency/units").json()
    assert len(units) > 0
    unit_id = units[0]["id"]
    assert "lat" in units[0] and "lng" in units[0]

    # Dispatch
    disp_res = client.post(f"/api/public-services/emergency/{unit_id}/dispatch", json={"notes": "Urgent response"})
    assert disp_res.status_code == 200
    assert disp_res.json()["status"] == "Dispatched"

    # Recall
    recall_res = client.post(f"/api/public-services/emergency/{unit_id}/recall")
    assert recall_res.status_code == 200
    assert recall_res.json()["status"] == "Available"

def test_corridor_reroute_and_transit_coordinates():
    # Check transit coordinates
    transit = client.get("/api/transportation/transit").json()
    assert len(transit) > 0
    assert "lat" in transit[0] and "lng" in transit[0]

    # Check corridor rerouting
    corridors = client.get("/api/transportation/corridors").json()
    assert len(corridors) > 0
    corridor_id = corridors[0]["id"]
    reroute_res = client.post(f"/api/transportation/corridors/{corridor_id}/reroute", json={"action": "optimize_signals"})
    assert reroute_res.status_code == 200
    assert "Traffic flow optimization" in reroute_res.json()["message"]

def test_alert_playbook_execution():
    overview = client.get("/api/dashboard/overview").json()
    if overview["recent_alerts"]:
        alert_id = overview["recent_alerts"][0]["id"]
        # Execute emergency dispatch playbook
        res = client.post(f"/api/dashboard/alerts/{alert_id}/playbook", json={
            "action": "dispatch_emergency",
            "auto_resolve": False
        })
        assert res.status_code == 200
        assert res.json()["success"] is True

        # Execute ticket playbook
        res_ticket = client.post(f"/api/dashboard/alerts/{alert_id}/playbook", json={
            "action": "create_ticket",
            "priority": "Critical",
            "auto_resolve": True
        })
        assert res_ticket.status_code == 200
        assert "ticket_code" in res_ticket.json()
        assert res_ticket.json()["alert_resolved"] is True

def test_ai_assistant_agentic_tool_execution():
    # Test 1: Dispatch emergency command
    disp_res = client.post("/api/ai/chat", json={"prompt": "Dispatch EMS to District 3 immediately"})
    assert disp_res.status_code == 200
    disp_data = disp_res.json()
    assert "action_executed" in disp_data
    assert disp_data["action_executed"]["tool"] == "dispatch_emergency"
    assert disp_data["action_executed"]["status"] == "success"

    # Test 2: Create ticket command
    tck_res = client.post("/api/ai/chat", json={"prompt": "Create maintenance ticket for broken pump in District 2"})
    assert tck_res.status_code == 200
    tck_data = tck_res.json()
    assert "action_executed" in tck_data
    assert tck_data["action_executed"]["tool"] == "create_maintenance_ticket"
    assert tck_data["action_executed"]["status"] == "success"

    # Test 3: Resolve alert command
    res_alert = client.post("/api/ai/chat", json={"prompt": "Resolve alert ALT-2026-001"})
    assert res_alert.status_code == 200
    alert_data = res_alert.json()
    assert "action_executed" in alert_data
    assert alert_data["action_executed"]["tool"] == "resolve_alert"

def test_reports_summary_and_csv_export():
    # 1. Test Summary
    res = client.get("/api/dashboard/reports/summary")
    assert res.status_code == 200
    data = res.json()
    assert "city_health_score" in data
    assert "sla_compliance" in data
    assert "alerts_summary" in data

    # 2. Test CSV Export
    csv_res = client.get("/api/dashboard/reports/export")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers.get("content-type", "")
    assert "CITYPULSE EXECUTIVE OPERATIONS & AUDIT REPORT" in csv_res.text

def test_simulation_scenario_injection_and_reset():
    # 1. Inject highway pileup crisis
    inj_res = client.post("/api/dashboard/simulation/inject-scenario", json={"scenario": "highway_pileup", "district_id": 2})
    assert inj_res.status_code == 200
    assert "Highway Pileup Crisis injected" in inj_res.json()["message"]

    # 2. Verify corridor congestion spiked
    corridors = client.get("/api/transportation/corridors?district_id=2").json()
    assert len(corridors) > 0
    assert corridors[0]["congestion_index"] >= 90.0

    # 3. Reset simulation
    reset_res = client.post("/api/dashboard/simulation/reset")
    assert reset_res.status_code == 200
    assert "successfully reset" in reset_res.json()["message"]

def test_alert_resolution_and_playbook_resilience_to_missing_ids():
    # 1. Test resolving with non-existent or simulated ID
    res = client.post("/api/dashboard/alerts/9999999/resolve")
    assert res.status_code == 200
    assert "resolved" in res.json() or "message" in res.json()

    # 2. Test executing playbook with non-existent ID
    res_pb = client.post("/api/dashboard/alerts/9999999/playbook", json={
        "action": "dispatch_emergency",
        "priority": "Critical",
        "auto_resolve": True
    })
    assert res_pb.status_code == 200
    assert res_pb.json()["success"] is True





