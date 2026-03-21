# Pokémon Collection Backend

Container image builds stop after installing dependencies, so you launch the FastAPI app yourself once the image is ready. Choose whichever route fits your workflow:

## Local Python environment
1. Create and activate a virtual environment.
2. Install dependencies with `pip install -r requirements.txt`.
3. Start FastAPI via `uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload`.

## Docker
1. Build: `docker build -t pokemon-api .`
2. Run: `docker run --rm -p 8000:8000 pokemon-api`

Once running, the API is available at http://localhost:8000 and the interactive docs live at http://localhost:8000/docs.
