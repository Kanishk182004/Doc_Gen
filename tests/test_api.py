import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "llm_provider" in data

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data

def test_agent_validation_empty_request():
    response = client.post("/agent", json={"request": "   "})
    assert response.status_code == 422

def test_agent_validation_short_request():
    response = client.post("/agent", json={"request": "hi"})
    assert response.status_code == 422

def test_agent_standard_project_plan():
    req = {
        "request": "Create a project plan for launching an AI-powered customer support chatbot for a 50-person e-commerce company within 8 weeks. Include phases, milestones, risks, owners, and success metrics."
    }
    response = client.post("/agent", json=req)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["document_type"] == "Project Plan"
    assert len(data["plan"]) == 4
    assert all(t["status"] == "completed" for t in data["plan"])
    assert data["quality_review"]["passed"] is True
    assert data["document_url"].startswith("/documents/")
    
    # Verify file download works
    doc_url = data["document_url"]
    file_res = client.get(doc_url)
    assert file_res.status_code == 200
    assert len(file_res.content) > 1000

def test_agent_complex_proposal():
    req = {
        "request": "Prepare a proposal for improving our customer support. We have a small team, a limited budget, and want to use AI, but we have not chosen a vendor or defined success metrics. Make reasonable assumptions, compare a lightweight pilot with a full rollout, identify risks, and recommend next steps without inventing exact costs."
    }
    response = client.post("/agent", json=req)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["document_type"] == "Business Proposal"
    assert len(data["assumptions"]) > 0
    assert data["quality_review"]["passed"] is True
    assert data["document_url"].startswith("/documents/")

def test_document_download_path_traversal_prevention():
    response = client.get("/documents/..%2Fsecret.txt")
    assert response.status_code in (400, 404)
    
    response2 = client.get("/documents/non_existent.docx")
    assert response2.status_code == 404

