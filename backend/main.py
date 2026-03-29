from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import admin_routes, collection_routes, scan_routes, search_routes

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include API route modules
app.include_router(scan_routes.router, prefix="/api/scan")
app.include_router(collection_routes.router, prefix="/api/collection")
app.include_router(admin_routes.router, prefix="/api/admin")
app.include_router(search_routes.router, prefix="/api/search")
