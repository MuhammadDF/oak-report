"""Mock pricing service for the first appraisal vertical slice."""

import re
from sqlmodel import select
import requests
from dotenv import load_dotenv
import os

from ..db.models import PricingCatalogTable
from ..db.session import SessionLocal
from ..models.card_model import CardIdentity

load_dotenv()


CARD_NUMBER_PATTERN = re.compile(r"#\s*([A-Za-z0-9-]+)")


def _normalize_card_number(value: str | None) -> str:
    """Normalize card numbers for safe equality checks."""
    if not value:
        return ""
    stripped = value.strip()
    if stripped.isdigit():
        return stripped.lstrip("0") or "0"
    return stripped.lower()


def _product_matches_card_number(product_name: str | None, card_num: str) -> bool:
    """Check if product name contains an exact #<card_num> token."""
    if not product_name:
        return False

    match = CARD_NUMBER_PATTERN.search(product_name)
    if not match:
        return False

    return _normalize_card_number(match.group(1)) == _normalize_card_number(card_num)


async def get_card_info(card: CardIdentity) -> tuple[float, str | None, str]:
    """Return a mock single market value that can later be replaced."""

    card_num = card.card_number.split("/")[0] if card.card_number else "0"
    card_num = str(card_num).lstrip("0") or "0"
    search_key = card.name
    normalized_language = (card.language or "").strip()
    known_languages = (
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
    is_non_english = bool(
        normalized_language) and normalized_language.lower() != "english"

    statement = select(PricingCatalogTable).where(
        PricingCatalogTable.product_name.ilike(f"%{search_key}%")
    )
    if is_non_english:
        statement = statement.where(
            PricingCatalogTable.console_name.ilike(f"%{normalized_language}%")
        )

    async with SessionLocal() as session:
        matches = (await session.exec(statement)).all()

    for match in matches:
        if not _product_matches_card_number(match.product_name, card_num):
            continue

        console_name = match.console_name or ""
        if normalized_language.lower() == "english" and any(
            language in console_name.lower() for language in known_languages
        ):
            continue

        price = match.loose_price
        if price is not None and float(price) > 0:
            image_url = match.image_url
            if not image_url:
                image_url = get_card_image(
                    match.id).replace("240.jpg", "1600.jpg")
                match.image_url = image_url

                async with SessionLocal() as session:
                    session.add(match)
                    await session.commit()

            return float(price), match.console_name, image_url

    return 1.0, "Unknown Set", ""


def get_all_cards():
    "Returns a csv of all cards from price charting."
    response = requests.get(
        f"https://www.pricecharting.com/price-guide/download-custom?t={os.getenv('PRICE_CHARTING')}&category=pokemon-cards",
        timeout=30,
    )
    if response.status_code == 200:
        return response.text
    else:
        raise Exception(f"Failed to fetch card data: {response.status_code}")


def get_card_image(id):
    "Returns a card image from the price charting marketplace."
    response = requests.get(
        f"https://www.pricecharting.com/api/offers?t={os.getenv('PRICE_CHARTING')}&id={id}&status=sold",
        timeout=30,
    )
    if response.status_code == 200:
        data = response.json()

    if data.get("offers"):
        return data["offers"][0]["image-url"]
    else:
        return ""
        # raise Exception(f"Failed to fetch card image: {response.status_code}")


async def get_all_card_info(card: CardIdentity) -> list[PricingCatalogTable]:
    """Return all matching catalog rows for a card query."""

    card_num = card.card_number.split("/")[0] if card.card_number else "0"
    card_num = str(card_num).lstrip("0") or "0"
    search_key = card.name
    normalized_language = (card.language or "").strip()
    known_languages = (
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
    is_non_english = bool(
        normalized_language) and normalized_language.lower() != "english"

    statement = select(PricingCatalogTable).where(
        PricingCatalogTable.product_name.ilike(f"%{search_key}%")
    )
    if is_non_english:
        statement = statement.where(
            PricingCatalogTable.console_name.ilike(f"%{normalized_language}%")
        )

    async with SessionLocal() as session:
        matches = (await session.exec(statement)).all()

        filtered_matches: list[PricingCatalogTable] = []
        has_updates = False

        for match in matches:
            if not _product_matches_card_number(match.product_name, card_num):
                continue

            console_name = match.console_name or ""
            if normalized_language.lower() == "english" and any(
                language in console_name.lower() for language in known_languages
            ):
                continue

            if not match.image_url:
                image_url = get_card_image(match.id)
                if image_url:
                    match.image_url = image_url.replace("240.jpg", "1600.jpg")
                    session.add(match)
                    has_updates = True

            filtered_matches.append(match)

        if has_updates:
            await session.commit()

    return filtered_matches
