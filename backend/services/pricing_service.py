"""Mock pricing service for the first appraisal vertical slice."""

from statistics import mean

from ..models.card_model import CardIdentity
from ..models.scan_result_model import PricePoint, PricingSnapshot


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
    estimated_market_value = round(mean(point.price for point in price_points), 2)
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
