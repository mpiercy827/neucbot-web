import logging

from fastapi import APIRouter, HTTPException
from app.models.requests import ChainListRequest
from app.models.responses import CalculationResponse, FetchChainListsResponse
from app.services import neucbot as neucbot_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/chain_lists", response_model=FetchChainListsResponse)
def fetch_chain_lists():
    return neucbot_service.fetch_chain_lists()


@router.post("/chain_lists", response_model=CalculationResponse)
def calculate_chain_list(request: ChainListRequest):
    try:
        return neucbot_service.calculate_chain_list(
            material=request.material,
            chain_list=request.chain_list,
        )
    except Exception:
        logger.exception("chain_lists calculation failed | request=%s", request)
        raise HTTPException(status_code=500, detail="Calculation failed — Internal Server Error.")
