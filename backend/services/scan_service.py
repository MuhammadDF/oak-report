"""Scan orchestration for the first appraisal vertical slice."""

from datetime import datetime, timezone
import hashlib

from pydantic import HttpUrl
from ..models.card_model import CardCondition, CardIdentity
from ..models.scan_result_model import ScanResultModel
from .authentication_service import analyze_authenticity
from .pricing_service import get_pricing_snapshot

_MOCK_CARD_CATALOG = [
    CardIdentity(
        card_id="sv03-203",
        name="Charizard ex",
        supertype="Pokémon",
        set_name="Obsidian Flames",
        card_number="203",
        set_size=197,
        rarity="Ultra Rare",
        types=["Fire"],
        is_holo=True,
        promo=False,
        image_url=HttpUrl(
            "https://images.pokemontcg.io/sv03/203.png",
        ),
    ),
    CardIdentity(
        card_id="swsh12pt5gg-44",
        name="Mewtwo VSTAR",
        supertype="Pokémon",
        set_name="Crown Zenith",
        card_number="GG44",
        set_size=70,
        rarity="Ultra Rare",
        types=["Psychic"],
        is_holo=True,
        promo=False,
        image_url=HttpUrl(
            "https://images.pokemontcg.io/swsh12pt5gg/GG44.png"
		),
    ),
    CardIdentity(
        card_id="base1-4",
        name="Charizard",
        supertype="Pokémon",
        set_name="Base Set",
        card_number="4",
        set_size=102,
        rarity="Rare",
        types=["Fire"],
        is_holo=True,
        promo=False,
        image_url=HttpUrl(
            "https://images.pokemontcg.io/base1/4.png"
        ),
    ),
]


async def identify_card_from_image(image_bytes: bytes) -> ScanResultModel:
    """Analyze an uploaded image and return a mocked appraisal payload."""

    card = _select_card_identity(image_bytes)
    authenticity = await analyze_authenticity(image_bytes)
    pricing = await get_pricing_snapshot(card)

    return ScanResultModel(
        scan_id=_build_scan_id(image_bytes),
        processed_at=datetime.now(timezone.utc),
        card=card,
        condition=CardCondition(condition_label="Near Mint"),
        authenticity=authenticity,
        pricing=pricing,
    )


def _select_card_identity(image_bytes: bytes) -> CardIdentity:
    if not image_bytes:
        return _MOCK_CARD_CATALOG[0]
    index = image_bytes[0] % len(_MOCK_CARD_CATALOG)
    return _MOCK_CARD_CATALOG[index]


def _build_scan_id(image_bytes: bytes) -> str:
    digest = hashlib.sha256(image_bytes).hexdigest()[:12]
    return f"scan-{digest}"
