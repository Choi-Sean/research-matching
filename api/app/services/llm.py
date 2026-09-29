"""Thin wrapper around the Anthropic SDK.

Every AI feature in Labora has a rule-based fallback, so ``structured`` returns ``None`` (rather than raising)
whenever the AI is unavailable — no key configured, network trouble, or a safety refusal — and callers degrade
gracefully.
"""
from __future__ import annotations

import logging
from typing import TypeVar

from pydantic import BaseModel

from app.config import settings

log = logging.getLogger("labora.llm")
T = TypeVar("T", bound=BaseModel)

# Models that accept the server-side refusal `fallbacks` parameter / the `effort` control.
_FALLBACK_MODELS = {"claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"}
_EFFORT_PREFIXES = ("claude-opus-5", "claude-sonnet-5", "claude-fable", "claude-opus-4-8", "claude-opus-4-7",
                    "claude-opus-4-6", "claude-sonnet-4-6")

LANGUAGE_NAMES = {
    "en": "English", "ko": "Korean", "es": "Spanish", "zh": "Simplified Chinese", "zh-TW": "Traditional Chinese",
    "ja": "Japanese", "fr": "French", "de": "German", "pt": "Brazilian Portuguese", "it": "Italian",
    "nl": "Dutch", "pl": "Polish", "ru": "Russian", "uk": "Ukrainian", "tr": "Turkish", "ar": "Arabic",
    "he": "Hebrew", "fa": "Persian", "hi": "Hindi", "bn": "Bengali", "vi": "Vietnamese", "th": "Thai",
    "id": "Indonesian", "fil": "Filipino",
}


def language_name(code: str | None) -> str:
    return LANGUAGE_NAMES.get(code or "en", "English")


class LLM:
    def __init__(self) -> None:
        self._client = None

    @property
    def enabled(self) -> bool:
        return bool(settings.anthropic_api_key)

    def _get_client(self):
        if self._client is None:
            import anthropic

            self._client = anthropic.Anthropic(
                api_key=settings.anthropic_api_key,
                timeout=settings.anthropic_timeout_seconds,
                max_retries=2,
            )
        return self._client

    def structured(self, *, system: str, user: str, schema: type[T], max_tokens: int = 6000) -> T | None:
        """Ask for JSON that validates against ``schema``. Returns None if AI is unavailable or declined."""
        if not self.enabled:
            return None
        model = settings.anthropic_model
        kwargs: dict = dict(
            model=model,
            max_tokens=max_tokens,
            system=[{"type": "text", "text": system}],
            messages=[{"role": "user", "content": user}],
            output_format=schema,
        )
        if model.startswith(_EFFORT_PREFIXES):
            kwargs["output_config"] = {"effort": settings.anthropic_effort}
        try:
            client = self._get_client()
            if model in _FALLBACK_MODELS:
                # If a safety classifier declines, the API transparently retries on the fallback model.
                resp = client.beta.messages.parse(
                    betas=["server-side-fallback-2026-07-01"], fallbacks="default", **kwargs
                )
            else:
                resp = client.messages.parse(**kwargs)
        except Exception as exc:  # noqa: BLE001 — any SDK/network/parse failure must degrade, not 500
            log.warning("AI call failed (%s): %s", type(exc).__name__, exc)
            return None
        if getattr(resp, "stop_reason", None) == "refusal":
            log.info("AI declined the request")
            return None
        return resp.parsed_output


llm = LLM()
