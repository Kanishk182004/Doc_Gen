import json
import logging
import re
from typing import Optional, Dict, Any, Type, TypeVar
import httpx
from pydantic import BaseModel
from app.config import settings

logger = logging.getLogger("autonomous_agent.llm")

T = TypeVar("T", bound=BaseModel)

PROVIDER_DEFAULT_MODELS = {
    "groq": "openai/gpt-oss-120b",
    "openai": "gpt-4o-mini",
    "anthropic": "claude-3-5-haiku-20241022",
    "gemini": "gemini-1.5-flash"
}

class LLMClient:
    """Multi-provider client supporting Groq, OpenAI, Anthropic, and Google Gemini with graceful fallbacks."""

    def __init__(
        self,
        provider: str = "groq",
        api_key: Optional[str] = None,
        model: Optional[str] = None
    ):
        self.provider = (provider or "groq").lower().strip()
        
        # Resolve key: use user provided key if given, else check provider-specific env vars
        if api_key and api_key.strip():
            self.api_key = api_key.strip()
        elif self.provider == "groq":
            self.api_key = settings.GROQ_API_KEY
        else:
            self.api_key = ""

        # Resolve model
        self.model = model or PROVIDER_DEFAULT_MODELS.get(self.provider, settings.GROQ_MODEL)

    @property
    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and not self.api_key.startswith("your_"))

    def chat_completion(
        self,
        messages: list,
        temperature: float = 0.2,
        response_format: Optional[dict] = None,
        max_tokens: Optional[int] = None,
        timeout: float = 40.0
    ) -> Optional[str]:
        if not self.is_available:
            return None

        # Safe default max_tokens to prevent LLM generation from being preemptively throttled by API TPM limits
        effective_max_tokens = max_tokens or (1500 if self.provider == "groq" else 4096)

        max_retries = 3
        backoff_seconds = 2.0

        for attempt in range(max_retries):
            try:
                with httpx.Client(timeout=timeout) as client:
                    if self.provider in ["groq", "openai"]:
                        url = "https://api.openai.com/v1/chat/completions" if self.provider == "openai" else "https://api.groq.com/openai/v1/chat/completions"
                        headers = {
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json"
                        }
                        payload = {
                            "model": self.model,
                            "messages": messages,
                            "temperature": temperature,
                            "max_tokens": effective_max_tokens
                        }
                        if response_format:
                            payload["response_format"] = response_format

                        res = client.post(url, headers=headers, json=payload)
                        if res.status_code == 200:
                            return res.json()["choices"][0]["message"]["content"]
                        elif res.status_code == 429 and attempt < max_retries - 1:
                            # Parse retry delay if provided by Groq
                            retry_match = re.search(r"Please try again in ([0-9.]+)(ms|s)", res.text)
                            if retry_match:
                                val = float(retry_match.group(1))
                                delay = (val / 1000.0) if retry_match.group(2) == "ms" else val
                                sleep_time = max(delay + 0.5, backoff_seconds)
                            else:
                                sleep_time = backoff_seconds
                            logger.info(f"{self.provider} rate limited (429). Retrying in {sleep_time:.1f}s (attempt {attempt+1}/{max_retries})...")
                            import time
                            time.sleep(sleep_time)
                            backoff_seconds *= 1.5
                            continue
                        else:
                            logger.warning(f"{self.provider} API returned HTTP {res.status_code}: {res.text}")
                            return None

                    elif self.provider == "anthropic":
                        url = "https://api.anthropic.com/v1/messages"
                        headers = {
                            "x-api-key": self.api_key,
                            "anthropic-version": "2023-06-01",
                            "Content-Type": "application/json"
                        }
                        # Anthropic messages format: extract system message if present
                        user_content = ""
                        for m in messages:
                            user_content += f"{m['role'].upper()}: {m['content']}\n\n"

                        payload = {
                            "model": self.model,
                            "max_tokens": 4096,
                            "temperature": temperature,
                            "messages": [{"role": "user", "content": user_content.strip()}]
                        }
                        res = client.post(url, headers=headers, json=payload)
                        if res.status_code == 200:
                            return res.json()["content"][0]["text"]
                        else:
                            logger.warning(f"Anthropic API returned HTTP {res.status_code}: {res.text}")
                            return None

                    elif self.provider == "gemini":
                        # Google Gemini REST API
                        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
                        headers = {"Content-Type": "application/json"}
                        prompt_text = "\n\n".join([f"{m['role']}: {m['content']}" for m in messages])
                        payload = {
                            "contents": [{"parts": [{"text": prompt_text}]}],
                            "generationConfig": {"temperature": temperature}
                        }
                        res = client.post(url, headers=headers, json=payload)
                        if res.status_code == 200:
                            candidates = res.json().get("candidates", [])
                            if candidates and "content" in candidates[0]:
                                return candidates[0]["content"]["parts"][0]["text"]
                            return None
                        else:
                            logger.warning(f"Gemini API returned HTTP {res.status_code}: {res.text}")
                            return None

            except httpx.TimeoutException:
                logger.error(f"{self.provider} API request timed out.")
                return None
            except Exception as e:
                logger.error(f"{self.provider} API request failed: {e}")
                return None
        return None

    def extract_json(self, text: str) -> Optional[dict]:
        """Safely extract JSON object from LLM response text (handles markdown code fences)."""
        if not text:
            return None
        text = text.strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass

        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start:end+1])
            except json.JSONDecodeError:
                pass

        return None
