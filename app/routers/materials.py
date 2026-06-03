import logging

from fastapi import APIRouter, HTTPException
from app.models.responses import CalculationResponse, FetchMaterialsResponse
from app.services import neucbot as neucbot_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/materials", response_model=FetchMaterialsResponse)
def fetch_chain_lists():
    return neucbot_service.fetch_materials()


