from fastapi import FastAPI
from .api import scan_routes, collection_routes, admin_routes

app = FastAPI()

# Import and include API route modules
app.include_router(scan_routes.router, prefix="/api/scan")
app.include_router(collection_routes.router, prefix="/api/collection")
app.include_router(admin_routes.router, prefix="/api/admin")
