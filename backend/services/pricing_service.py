"""Mock pricing service for the first appraisal vertical slice."""

from io import StringIO
from statistics import mean
import requests
from dotenv import load_dotenv
import os
import pandas as pd

from ..models.card_model import CardIdentity
from ..models.scan_result_model import PricePoint, PricingSnapshot

load_dotenv()


async def get_pricing_snapshot(card: CardIdentity) -> PricingSnapshot:
    """Return stable mock pricing that can later be replaced with live providers."""

    base_price = _base_price_for_card(card)
    price_points = [
        PricePoint(
            source="TCGPlayer",
            label="Market Price",
            price=round(base_price, 2),
            url="https://www.tcgplayer.com/",
        ),
        PricePoint(
            source="PriceCharting",
            label="Ungraded",
            price=round(base_price * 0.96, 2),
            url="https://www.pricecharting.com/",
        ),
        PricePoint(
            source="eBay",
            label="Recent Sold Average",
            price=round(base_price * 1.04, 2),
            url="https://www.ebay.com/",
        ),
    ]
    estimated_market_value = round(
        mean(point.price for point in price_points), 2)
    return PricingSnapshot(
        estimated_market_value=estimated_market_value,
        price_points=price_points,
    )


def _base_price_for_card(card: CardIdentity) -> float:
    name_score = sum(ord(character) for character in card.name)
    rarity_multiplier = {
        "Common": 1.0,
        "Uncommon": 1.4,
        "Rare": 2.2,
        "Ultra Rare": 4.8,
    }.get(card.rarity or "", 1.3)
    holo_bonus = 6.5 if card.is_holo else 0.0
    return ((name_score % 22) + 4) * rarity_multiplier + holo_bonus


def get_all_cards():
    "Returns a csv of all cards from price charting."
    response = requests.get(
        f"https://www.pricecharting.com/price-guide/download-custom?t={os.getenv('PRICE_CHARTING')}&category=pokemon-cards")
    if response.status_code == 200:
        return response.text
    else:
        raise Exception(f"Failed to fetch card data: {response.status_code}")

def get_card_image(ID):
    """Fetches card image and returns it as a DataFrame."""
    response = requests.get(
        f"https://www.pricecharting.com/api/offers?t={os.getenv('PRICE_CHARTING')}&ID={ID}&status=available")
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to fetch card data: {response.status_code}")
    