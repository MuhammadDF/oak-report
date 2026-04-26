from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest
from sqlmodel import select

from backend.db.models import PricingCatalogTable
from backend.services.pricing_service import (
    _normalize_card_number,
    _product_matches_card_number,
    get_all_card_info,
    get_all_cards,
    get_card_info,
    get_card_image,
)


@pytest.fixture
def pricing_test_sessionlocal(monkeypatch: pytest.MonkeyPatch, db_session_factory):
    monkeypatch.setattr("backend.services.pricing_service.SessionLocal", db_session_factory)
    return db_session_factory


def test_normalize_card_number_handles_numeric_and_alphanumeric() -> None:
    assert _normalize_card_number("004") == "4"
    assert _normalize_card_number(" TG10 ") == "tg10"
    assert _normalize_card_number(None) == ""


def test_product_matches_card_number_exact_match() -> None:
    assert _product_matches_card_number("Charizard #4 Holo", "004") is True
    assert _product_matches_card_number("Charizard #5 Holo", "4") is False
    assert _product_matches_card_number(None, "4") is False


def test_product_matches_card_number_requires_number_token() -> None:
    assert _product_matches_card_number("Charizard Holo", "4") is False


def test_get_all_cards_returns_csv_text_on_success() -> None:
    response = MagicMock(status_code=200, text="id,name\n1,Charizard")

    with patch("backend.services.pricing_service.requests.get", return_value=response):
        result = get_all_cards()

    assert result == "id,name\n1,Charizard"


def test_get_all_cards_raises_on_failure_status() -> None:
    response = MagicMock(status_code=500)

    with patch("backend.services.pricing_service.requests.get", return_value=response):
        with pytest.raises(Exception, match="Failed to fetch card data: 500"):
            get_all_cards()


def test_get_card_image_returns_first_offer_image() -> None:
    response = MagicMock(status_code=200)
    response.json.return_value = {"offers": [{"image-url": "https://example.com/card.jpg"}]}

    with patch("backend.services.pricing_service.requests.get", return_value=response):
        result = get_card_image("abc")

    assert result == "https://example.com/card.jpg"


def test_get_card_image_returns_empty_when_no_offers() -> None:
    response = MagicMock(status_code=200)
    response.json.return_value = {"offers": []}

    with patch("backend.services.pricing_service.requests.get", return_value=response):
        result = get_card_image("abc")

    assert result == ""


def test_get_card_image_returns_empty_when_status_is_not_success() -> None:
    response = MagicMock(status_code=500)

    with patch("backend.services.pricing_service.requests.get", return_value=response):
        with pytest.raises(UnboundLocalError):
            get_card_image("abc")


@pytest.mark.asyncio(loop_scope="session")
async def test_get_card_info_returns_unknown_when_no_match(pricing_test_sessionlocal) -> None:
    from backend.models.card_model import CardIdentity

    _ = pricing_test_sessionlocal
    result = await get_card_info(CardIdentity(name="MissingNo", card_number="999", language="English"))

    assert result == (1.0, "Unknown Set", "")


@pytest.mark.asyncio(loop_scope="session")
async def test_get_card_info_skips_rows_with_non_matching_card_numbers(
    db_session,
    pricing_test_sessionlocal,
) -> None:
    from backend.models.card_model import CardIdentity

    _ = pricing_test_sessionlocal
    db_session.add(
        PricingCatalogTable(
            id="pc-1",
            product_name="Charizard #5",
            console_name="Pokemon Base Set",
            loose_price=249.99,
            image_url="https://example.com/cards/charizard-1600.jpg",
            tcg_id=None,
            refreshed_at=datetime.now(UTC),
        )
    )
    await db_session.commit()

    result = await get_card_info(CardIdentity(name="Charizard", card_number="004", language="English"))

    assert result == (1.0, "Unknown Set", "")


@pytest.mark.asyncio(loop_scope="session")
async def test_get_card_info_fetches_and_persists_missing_image(
    db_session,
    pricing_test_sessionlocal,
) -> None:
    from backend.models.card_model import CardIdentity

    _ = pricing_test_sessionlocal
    db_session.add(
        PricingCatalogTable(
            id="pc-1",
            product_name="Charizard #4",
            console_name="Pokemon Base Set",
            loose_price=249.99,
            image_url="",
            tcg_id=None,
            refreshed_at=datetime.now(UTC),
        )
    )
    await db_session.commit()

    with patch(
        "backend.services.pricing_service.get_card_image",
        return_value="https://example.com/cards/charizard-240.jpg",
    ):
        result = await get_card_info(CardIdentity(name="Charizard", card_number="004", language="English"))

    assert result == (249.99, "Pokemon Base Set", "https://example.com/cards/charizard-1600.jpg")
    async with pricing_test_sessionlocal() as verify_session:
        row = (await verify_session.exec(select(PricingCatalogTable).where(PricingCatalogTable.id == "pc-1"))).first()

    assert row is not None
    assert row.image_url == "https://example.com/cards/charizard-1600.jpg"


@pytest.mark.asyncio(loop_scope="session")
async def test_get_card_info_skips_foreign_language_entries_for_english_cards(
    db_session,
    pricing_test_sessionlocal,
) -> None:
    from backend.models.card_model import CardIdentity

    _ = pricing_test_sessionlocal
    db_session.add(
        PricingCatalogTable(
            id="pc-1",
            product_name="Charizard #4",
            console_name="Pokemon Japanese",
            loose_price=249.99,
            image_url="https://example.com/cards/charizard-1600.jpg",
            tcg_id=None,
            refreshed_at=datetime.now(UTC),
        )
    )
    await db_session.commit()

    result = await get_card_info(CardIdentity(name="Charizard", card_number="004", language="English"))

    assert result == (1.0, "Unknown Set", "")


@pytest.mark.asyncio(loop_scope="session")
async def test_get_card_info_filters_non_english_lookup_by_console_name(
    db_session,
    pricing_test_sessionlocal,
) -> None:
    from backend.models.card_model import CardIdentity

    _ = pricing_test_sessionlocal
    db_session.add(
        PricingCatalogTable(
            id="pc-1",
            product_name="Pikachu #25",
            console_name="Pokemon Japanese",
            loose_price=10.5,
            image_url="https://example.com/cards/pikachu-1600.jpg",
            tcg_id=None,
            refreshed_at=datetime.now(UTC),
        )
    )
    await db_session.commit()

    result = await get_card_info(CardIdentity(name="Pikachu", card_number="025", language="Japanese"))

    assert result == (10.5, "Pokemon Japanese", "https://example.com/cards/pikachu-1600.jpg")


@pytest.mark.asyncio(loop_scope="session")
async def test_get_all_card_info_filters_and_commits_image_updates(
    db_session,
    pricing_test_sessionlocal,
) -> None:
    from backend.models.card_model import CardIdentity

    _ = pricing_test_sessionlocal
    db_session.add_all(
        [
            PricingCatalogTable(
                id="pc-1",
                product_name="Charizard #4",
                console_name="Pokemon Base Set",
                loose_price=249.99,
                image_url="",
                tcg_id=None,
                refreshed_at=datetime.now(UTC),
            ),
            PricingCatalogTable(
                id="pc-2",
                product_name="Charizard #5",
                console_name="Pokemon Base Set",
                loose_price=99.99,
                image_url="",
                tcg_id=None,
                refreshed_at=datetime.now(UTC),
            ),
            PricingCatalogTable(
                id="pc-3",
                product_name="Charizard #4",
                console_name="Pokemon Japanese",
                loose_price=80.0,
                image_url="",
                tcg_id=None,
                refreshed_at=datetime.now(UTC),
            ),
        ]
    )
    await db_session.commit()

    with patch(
        "backend.services.pricing_service.get_card_image",
        return_value="https://example.com/cards/charizard-240.jpg",
    ):
        result = await get_all_card_info(
            CardIdentity(name="Charizard", card_number="004/102", language="English")
        )

    assert len(result) == 1
    assert result[0].id == "pc-1"
    assert result[0].image_url == "https://example.com/cards/charizard-1600.jpg"
    async with pricing_test_sessionlocal() as verify_session:
        row = (await verify_session.exec(select(PricingCatalogTable).where(PricingCatalogTable.id == "pc-1"))).first()

    assert row is not None
    assert row.image_url == "https://example.com/cards/charizard-1600.jpg"


@pytest.mark.asyncio(loop_scope="session")
async def test_get_all_card_info_keeps_existing_images_without_commit(
    db_session,
    pricing_test_sessionlocal,
) -> None:
    from backend.models.card_model import CardIdentity

    _ = pricing_test_sessionlocal
    db_session.add(
        PricingCatalogTable(
            id="pc-1",
            product_name="Charizard #4",
            console_name="Pokemon Base Set",
            loose_price=249.99,
            image_url="https://example.com/cards/charizard-1600.jpg",
            tcg_id=None,
            refreshed_at=datetime.now(UTC),
        )
    )
    await db_session.commit()

    with patch(
        "backend.services.pricing_service.get_card_image"
    ) as mock_get_card_image:
        result = await get_all_card_info(CardIdentity(name="Charizard", card_number="004", language="English"))

    assert len(result) == 1
    assert result[0].image_url == "https://example.com/cards/charizard-1600.jpg"
    mock_get_card_image.assert_not_called()


@pytest.mark.asyncio(loop_scope="session")
async def test_get_all_card_info_applies_non_english_filter_without_card_number(
    db_session,
    pricing_test_sessionlocal,
) -> None:
    from backend.models.card_model import CardIdentity

    _ = pricing_test_sessionlocal
    db_session.add(
        PricingCatalogTable(
            id="pc-1",
            product_name="Pikachu #25",
            console_name="Pokemon Japanese",
            loose_price=12.0,
            image_url="https://example.com/cards/pikachu-1600.jpg",
            tcg_id=None,
            refreshed_at=datetime.now(UTC),
        )
    )
    await db_session.commit()

    result = await get_all_card_info(CardIdentity(name="Pikachu", card_number=None, language="Japanese"))

    assert len(result) == 1
    assert result[0].console_name == "Pokemon Japanese"
