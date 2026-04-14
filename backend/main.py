from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import (
    admin_routes,
    auth_routes,
    collection_routes,
    library_routes,
    scan_routes,
    search_routes,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"^https?://(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):5173$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include API route modules
app.include_router(scan_routes.router, prefix="/api/scan")
app.include_router(collection_routes.router, prefix="/api/collection")
app.include_router(admin_routes.router, prefix="/api/admin")
app.include_router(search_routes.router, prefix="/api/search")
app.include_router(auth_routes.router, prefix="/api/auth")
app.include_router(library_routes.router, prefix="/api/library")
