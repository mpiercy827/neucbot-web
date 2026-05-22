"""
Service layer for running neucBOT calculations.

This module is responsible for:
  - Translating API request models into the dicts neucBOT's from_json methods expect
  - Calling neucBOT directly as a Python library (no subprocess or temp files)
  - Mapping neucBOT's output dict into structured response models
"""

import os

from neucbot.alpha import AlphaList, ChainAlphaList
from neucbot.material import Composition
from neucbot.runner import NeucbotRunner
from neucbot.config import Config

from app.models.requests import AlphaListRequest, ChainListRequest, MaterialIsotope
from app.models.responses import (
    CalculationResponse,
    FetchAlphaListsResponse,
    FetchChainListsResponse,
)

# Config used for all web requests: json=True makes NeucbotRunner return a dict
# rather than printing to stdout, and suppresses the tqdm progress bar.
neucbot_config = Config({"json": True})
data_source_class = neucbot_config.data_source_class
neucbot_runner = NeucbotRunner(neucbot_config)


def material_json(material: list[MaterialIsotope]) -> dict:
    """Translate API material isotopes into the dict Composition.from_json expects."""
    return {
        "elements": [
            {
                "element": isotope.symbol,
                "mass_number": isotope.mass_number,
                "fraction": isotope.mass_fraction,
            }
            for isotope in material
        ]
    }


def fetch_alpha_lists() -> FetchAlphaListsResponse:
    return FetchAlphaListsResponse(
        elements=sorted(
            [file.removesuffix("Alphas.dat") for file in os.listdir("AlphaLists")]
        )
    )


def calculate_alpha_list(
    material: list[MaterialIsotope],
    alpha_list: AlphaList,
) -> CalculationResponse:
    """Run a neucBOT alpha list calculation."""
    composition = Composition.from_json(material_json(material), data_source_class)

    if alpha_list.alphas:
        alpha_list_obj = AlphaList.from_json(alpha_list.alphas)
    else:
        alpha_list_obj = AlphaList.from_filepath(
            f"AlphaLists/{alpha_list.element}Alphas.dat"
        )
        alpha_list_obj.load_or_fetch()

    result = neucbot_runner.run(alpha_list_obj, composition)
    return CalculationResponse(
        total_neutron_yield=result["total_neutron_yield"],
        spectrum_integral=result["spectrum_integral"],
        isotope_contributions=result.get("cross_sections", {}),
        neutron_spectrum=result.get("spectra_totals", {}),
    )


def fetch_chain_lists() -> FetchChainListsResponse:
    return FetchChainListsResponse(
        chains=sorted([file.removesuffix("Chain.dat") for file in os.listdir("Chains")])
    )


def calculate_chain_list(
    material: list[MaterialIsotope],
    chain_list: list,
) -> CalculationResponse:
    """Run a neucBOT decay chain calculation."""
    composition = Composition.from_json(material_json(material), data_source_class)

    if chain_list.element:
        chain_alpha_list = ChainAlphaList.from_filepath(
            f"Chains/{chain_list.element}Chain.dat"
        )
        chain_alpha_list.load_or_fetch()
    else:
        chain_alpha_list = ChainAlphaList.from_json(chain_list.chain)

    result = neucbot_runner.run(chain_alpha_list, composition)

    return CalculationResponse(
        total_neutron_yield=result["total_neutron_yield"],
        spectrum_integral=result["spectrum_integral"],
        isotope_contributions=result.get("cross_sections", {}),
        neutron_spectrum=result.get("spectra_totals", {}),
    )
