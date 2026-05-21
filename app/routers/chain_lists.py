from fastapi import APIRouter, HTTPException
from app.models.requests import ChainListRequest
from app.models.responses import CalculationResponse
from app.services import neucbot as neucbot_service

router = APIRouter()


@router.post("/chain_lists", response_model=CalculationResponse)
def calculate_alpha_list(request: ChainListRequest):
    """
    Calculate (alpha,n) neutron yield for a given material and chain alpha list.
    """
    try:
        return neucbot_service.run_chain_list(
            material=request.material,
            chain_list=request.chain_list,
        )
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
