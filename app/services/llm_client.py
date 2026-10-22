import json
import logging
import re
from typing import Optional, Dict, Any, Type, TypeVar
import httpx
from pydantic import BaseModel
from app.config import settings

logger = logging.getLogger("autonomous_agent.llm")

T = TypeVar("T", bound=BaseModel)

class LLMClient:
    """Client for Groq LLM API with graceful error handling and deterministic fallback."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or settings.GROQ_MODEL
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    @property
    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and not self.api_key.startswith("your_"))

    def chat_completion(
        self,
        messages: list,
        temperature: float = 0.2,
        response_format: Optional[dict] = None,
        timeout: float = 40.0
    ) -> Optional[str]:
        if not self.is_available:
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature
        }
        if response_format:
            payload["response_format"] = response_format

        try:
            with httpx.Client(timeout=timeout) as client:
                response = client.post(self.base_url, headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    logger.warning(
                        f"Groq API returned HTTP {response.status_code}: {response.text}"
                    )
                    return None
        except httpx.TimeoutException:
            logger.error("Groq API request timed out.")
            return None
        except Exception as e:
            logger.error(f"Groq API request failed: {e}")
            return None

    def extract_json(self, text: str) -> Optional[dict]:
        """Safely extract JSON object from LLM response text (handles markdown code fences)."""
        if not text:
            return None
        # Try raw parse
        text = text.strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try markdown code fence regex
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass

        # Try finding outermost { ... }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start:end+1])
            except json.JSONDecodeError:
                pass

        return None

