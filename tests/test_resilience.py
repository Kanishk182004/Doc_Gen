import json
from unittest.mock import patch, MagicMock
import httpx
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_recovery_when_groq_times_out():
    """Verify system gracefully falls back and reports fallback mode when LLM provider fails."""
    with patch("app.services.llm_client.httpx.Client") as mock_client_cls:
        mock_instance = MagicMock()
        mock_instance.__enter__.return_value = mock_instance
        mock_instance.post.side_effect = httpx.TimeoutException("Simulated Groq timeout")
        mock_client_cls.return_value = mock_instance

        from app.agent.agent import DocumentAgent
        test_agent = DocumentAgent()
        test_agent.llm.api_key = "gsk_test_simulated_key"

        with patch("app.main.document_agent", test_agent):
            res = client.post("/agent", json={"request": "Create a project plan for an e-commerce chatbot"})
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "completed"
            assert data["quality_review"]["passed"] is True
            assert len(data["plan"]) == 4

def test_recovery_when_llm_returns_malformed_json():
    """Verify system safely recovers when LLM returns unstructured gibberish or invalid JSON."""
    with patch("app.services.llm_client.httpx.Client") as mock_client_cls:
        mock_instance = MagicMock()
        mock_instance.__enter__.return_value = mock_instance
        fake_response = MagicMock()
        fake_response.status_code = 200
        fake_response.json.return_value = {
            "choices": [{"message": {"content": "I cannot help with structured JSON. Here is random text."}}]
        }
        mock_instance.post.return_value = fake_response
        mock_client_cls.return_value = mock_instance

        from app.agent.agent import DocumentAgent
        test_agent = DocumentAgent()
        test_agent.llm.api_key = "gsk_test_simulated_key"

        with patch("app.main.document_agent", test_agent):
            res = client.post("/agent", json={"request": "Prepare a business proposal for support automation"})
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "completed"
            assert data["document_type"] == "Business Proposal"
            assert data["quality_review"]["passed"] is True

