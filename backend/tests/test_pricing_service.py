from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from backend.services.pricing_service import (
    _normalize_card_number,
    _product_matches_card_number,
    get_all_card_info,
    get_all_cards,
    get_card_info,
    get_card_image,
)


class _FakeExecResult:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return self._rows


class _FakeSession:
    def __init__(self, rows):
        self._rows = rows
        self.added: list[object] = []
        self.committed = False

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        _ = exc_type
        _ = exc
        _ = tb
        return False

    async def exec(self, statement):
        _ = statement
        return _FakeExecResult(self._rows)

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        self.committed = True


def test_normalize_card_number_handles_numeric_and_alphanumeric() -> None:
    assert _normalize_card_number("004") == "4"
    assert _normalize_card_number(" TG10 ") == "tg10"
    assert _normalize_card_number(None) == ""


def test_product_matches_card_number_exact_match() -> None:
    assert _product_matches_card_number("Charizard #4 Holo", "004") is True
    assert _product_matches_card_number("Charizard #5 Holo", "4") is False
    assert _product_matches_card_number(None, "4") is False


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


@pytest.mark.asyncio
async def test_get_card_info_returns_unknown_when_no_match() -> None:
    from backend.models.card_model import CardIdentity

    query_session = _FakeSession(rows=[])

    with patch("backend.services.pricing_service.SessionLocal", new=MagicMock(return_value=query_session)):
        result = await get_card_info(CardIdentity(name="MissingNo", card_number="999", language="English"))

    assert result == (1.0, "Unknown Set", "")


@pytest.mark.asyncio
async def test_get_card_info_fetches_and_persists_missing_image() -> None:
    from backend.models.card_model import CardIdentity

    match = SimpleNamespace(
        id="pc-1",
        product_name="Charizard #4",
        console_name="Pokemon Base Set",
        loose_price=249.99,
        image_url="",
        tcg_id=None,
        refreshed_at=datetime.now(UTC),
    )
    query_session = _FakeSession(rows=[match])
    write_session = _FakeSession(rows=[])

    with patch(
        "backend.services.pricing_service.SessionLocal",
        new=MagicMock(side_effect=[query_session, write_session]),
    ), patch(
        "backend.services.pricing_service.get_card_image",
        return_value="https://example.com/cards/charizard-240.jpg",
    ):
        result = await get_card_info(CardIdentity(name="Charizard", card_number="004", language="English"))

    assert result == (249.99, "Pokemon Base Set", "https://example.com/cards/charizard-1600.jpg")
    assert match.image_url == "https://example.com/cards/charizard-1600.jpg"
    assert write_session.committed is True
    assert write_session.added == [match]


@pytest.mark.asyncio
async def test_get_card_info_skips_foreign_language_entries_for_english_cards() -> None:
    from backend.models.card_model import CardIdentity

    foreign_language_match = SimpleNamespace(
        id="pc-1",
        product_name="Charizard #4",
        console_name="Pokemon Japanese",
        loose_price=249.99,
        image_url="https://example.com/cards/charizard-1600.jpg",
        tcg_id=None,
        refreshed_at=datetime.now(UTC),
    )

    with patch(
        "backend.services.pricing_service.SessionLocal",
        new=MagicMock(return_value=_FakeSession(rows=[foreign_language_match])),
    ):
        result = await get_card_info(CardIdentity(name="Charizard", card_number="004", language="English"))

    assert result == (1.0, "Unknown Set", "")


@pytest.mark.asyncio
async def test_get_card_info_filters_non_english_lookup_by_console_name() -> None:
    from backend.models.card_model import CardIdentity

    japanese_match = SimpleNamespace(
        id="pc-1",
        product_name="Pikachu #25",
        console_name="Pokemon Japanese",
        loose_price=10.5,
        image_url="https://example.com/cards/pikachu-1600.jpg",
        tcg_id=None,
        refreshed_at=datetime.now(UTC),
    )

    with patch(
        "backend.services.pricing_service.SessionLocal",
        new=MagicMock(return_value=_FakeSession(rows=[japanese_match])),
    ):
        result = await get_card_info(CardIdentity(name="Pikachu", card_number="025", language="Japanese"))

    assert result == (10.5, "Pokemon Japanese", "https://example.com/cards/pikachu-1600.jpg")


@pytest.mark.asyncio
async def test_get_all_card_info_filters_and_commits_image_updates() -> None:
    from backend.models.card_model import CardIdentity

    valid_match = SimpleNamespace(
        id="pc-1",
        product_name="Charizard #4",
        console_name="Pokemon Base Set",
        loose_price=249.99,
        image_url="",
        tcg_id=None,
        refreshed_at=datetime.now(UTC),
    )
    wrong_number = SimpleNamespace(
        id="pc-2",
        product_name="Charizard #5",
        console_name="Pokemon Base Set",
        loose_price=99.99,
        image_url="",
        tcg_id=None,
        refreshed_at=datetime.now(UTC),
    )
    wrong_language = SimpleNamespace(
        id="pc-3",
        product_name="Charizard #4",
        console_name="Pokemon Japanese",
        loose_price=80.0,
        image_url="",
        tcg_id=None,
        refreshed_at=datetime.now(UTC),
    )
    session = _FakeSession(rows=[valid_match, wrong_number, wrong_language])

    with patch("backend.services.pricing_service.SessionLocal", new=MagicMock(return_value=session)), patch(
        "backend.services.pricing_service.get_card_image",
        return_value="https://example.com/cards/charizard-240.jpg",
    ):
        result = await get_all_card_info(
            CardIdentity(name="Charizard", card_number="004/102", language="English")
        )

    assert len(result) == 1
    assert result[0].id == "pc-1"
    assert result[0].image_url == "https://example.com/cards/charizard-1600.jpg"
    assert session.committed is True
    assert session.added == [valid_match]


@pytest.mark.asyncio
async def test_get_all_card_info_keeps_existing_images_without_commit() -> None:
    from backend.models.card_model import CardIdentity

    existing_image_match = SimpleNamespace(
        id="pc-1",
        product_name="Charizard #4",
        console_name="Pokemon Base Set",
        loose_price=249.99,
        image_url="https://example.com/cards/charizard-1600.jpg",
        tcg_id=None,
        refreshed_at=datetime.now(UTC),
    )
    session = _FakeSession(rows=[existing_image_match])

    with patch("backend.services.pricing_service.SessionLocal", new=MagicMock(return_value=session)), patch(
        "backend.services.pricing_service.get_card_image"
    ) as mock_get_card_image:
        result = await get_all_card_info(CardIdentity(name="Charizard", card_number="004", language="English"))

    assert len(result) == 1
    assert result[0].image_url == "https://example.com/cards/charizard-1600.jpg"
    assert session.committed is False
    mock_get_card_image.assert_not_called()
