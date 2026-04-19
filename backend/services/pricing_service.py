"""Mock pricing service for the first appraisal vertical slice."""

from sqlmodel import select
import requests
from dotenv import load_dotenv
import os

from ..db.models import PricingCatalogTable
from ..db.session import SessionLocal
from ..models.card_model import CardIdentity

load_dotenv()


async def get_pricing_value(card: CardIdentity) -> float:
    """Return a mock single market value that can later be replaced."""

    card_num = card.card_number.split("/")[0] if card.card_number else "0"
    search_key = f"{card.name} #{card_num}"

    statement = (
        select(PricingCatalogTable)
        .where(PricingCatalogTable.product_name.ilike(f"%{search_key}%"))
        .limit(1)
    )
    async with SessionLocal() as session:
        match = (await session.exec(statement)).first()

    if match is None:
        return 1.0

    return float(match.loose_price)


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
