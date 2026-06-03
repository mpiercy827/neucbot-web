import logging

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routers import alpha_lists, chain_lists, materials, views

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

app = FastAPI(
    title="neucBOT Web API",
    description="Web API for neucBOT (alpha,n) neutron yield calculations",
    version="0.1.0",
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.include_router(views.router)
app.include_router(alpha_lists.router, prefix="/api")
app.include_router(chain_lists.router, prefix="/api")
app.include_router(materials.router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "ok"}
