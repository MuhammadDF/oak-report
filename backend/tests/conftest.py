from __future__ import annotations

from collections.abc import AsyncIterator
from pathlib import Path
import sys

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.auth.dependencies import get_current_user
from backend.auth.jwt_service import AuthTokenPayload
from backend.main import app


@pytest.fixture(autouse=True)
def override_auth_dependency() -> AsyncIterator[None]:
    def _mock_current_user() -> AuthTokenPayload:
        return AuthTokenPayload(
            sub="test-user",
            email="tester@example.com",
            display_name="Test User",
            role="admin",
            exp=4_102_444_800,
        )

    app.dependency_overrides[get_current_user] = _mock_current_user
    yield
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def async_client() -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client