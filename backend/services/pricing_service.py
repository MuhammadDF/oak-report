"""Mock pricing service for the first appraisal vertical slice."""

from sqlmodel import select
import requests
from dotenv import load_dotenv
import os

from ..db.models import PricingCatalogTable
from ..db.session import SessionLocal
from ..models.card_model import CardIdentity

load_dotenv()


async def get_card_info(card: CardIdentity) -> tuple[float, str | None, str]:
    """Return a mock single market value that can later be replaced."""

    card_num = card.card_number.split("/")[0] if card.card_number else "0"
    search_key = f"{card.name} #{card_num}"
    normalized_language = (card.language or "").strip()
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
        price = match.loose_price
        if price is not None and float(price) > 0:
            return float(price), match.console_name, match.image_url
                
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
