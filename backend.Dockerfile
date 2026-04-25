FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

ENV UV_LINK_MODE=copy
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY pyproject.toml ./
COPY alembic.ini ./

RUN uv sync --no-dev

COPY backend ./backend
COPY alembic ./alembic
COPY data ./data

EXPOSE 8000

CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000"]
