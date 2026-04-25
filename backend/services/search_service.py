"""Search orchestration for the pricing-catalog card search flow."""

from __future__ import annotations

import re

from ..db.models import PricingCatalogTable
from ..models.card_model import CardIdentity
from .pricing_service import get_all_card_info


KNOWN_LANGUAGES = (
    "english",
    "japanese",
    "chinese",
    "german",
    "korean",
    "french",
    "italian",
    "portuguese",
    "spanish",
    "polish",
)


def _parse_card_identity(query: str) -> CardIdentity:
    """Extract a structured card identity from a free-form search string."""

    normalized_query = re.sub(r"\s*/\s*", "/", query.strip())
    language = None
    for known_language in KNOWN_LANGUAGES:
        if re.search(rf"\b{re.escape(known_language)}\b", normalized_query, re.IGNORECASE):
            language = known_language
            normalized_query = re.sub(
                rf"\b{re.escape(known_language)}\b",
                " ",
                normalized_query,
                count=1,
                flags=re.IGNORECASE,
            )
            break

    tokens = normalized_query.split()
    card_number = None
    name_tokens: list[str] = []

    for token in tokens:
        # Keep slash-separated identifiers (e.g. tg10/tg30) intact.
        candidate = token.strip(".,;:!?()[]{}\"'")
        if card_number is None and any(character.isdigit() for character in candidate):
            card_number = candidate
            continue
        name_tokens.append(token)

    name = " ".join(name_tokens).replace("/", " ")
    name = " ".join(name.split()).strip()

    return CardIdentity(
        name=name,
        card_number=card_number,
        language=language.title() if language else "English",
    )


async def search_cards(query: str) -> list[PricingCatalogTable]:
    """Return pricing-catalog matches for a normalized free-form query."""

    card_identity = _parse_card_identity(query)
    if not card_identity.name and not card_identity.card_number:
        return []

    return await get_all_card_info(card_identity)
