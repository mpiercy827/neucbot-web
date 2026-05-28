import logging

from fastapi import APIRouter, HTTPException
from app.models.requests import AlphaListRequest
from app.models.responses import CalculationResponse, FetchAlphaListsResponse
from app.services import neucbot as neucbot_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/alpha_lists", response_model=FetchAlphaListsResponse)
def fetch_alpha_lists():
    return neucbot_service.fetch_alpha_lists()


@router.post("/alpha_lists", response_model=CalculationResponse)
def calculate_alpha_list(request: AlphaListRequest):
    try:
        return neucbot_service.calculate_alpha_list(
            material=request.material,
            alpha_list=request.alpha_list,
        )
    except Exception:
        logger.exception("alpha_lists calculation failed | request=%s", request)
        raise HTTPException(status_code=500, detail="Calculation failed — Internal Server Error.")
