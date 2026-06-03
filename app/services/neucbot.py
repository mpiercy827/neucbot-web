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

from app.models.requests import AlphaListRequest, ChainListRequest, Material
from app.models.responses import (
    CalculationResponse,
    FetchAlphaListsResponse,
    FetchChainListsResponse,
    FetchMaterialsResponse,
)

# Config used for all web requests: json=True makes NeucbotRunner return a dict
# rather than printing to stdout, and suppresses the tqdm progress bar.
neucbot_config = Config({"json": True})
data_source_class = neucbot_config.data_source_class
neucbot_runner = NeucbotRunner(neucbot_config)


def fetch_materials() -> FetchMaterialsResponse:
    return FetchMaterialsResponse(
        materials=sorted(
            [
                file.removesuffix(".dat").replace("_", " ")
                for file in os.listdir("Materials")
            ]
        )
    )


def material_composition_from_request(material: Material) -> Composition:
    if material.isotopes:
        return Composition.from_json(
            material_json(material.isotopes), data_source_class
        )
    else:
        return Composition.from_file(
            f"Materials/{material.name.replace(' ', '_')}.dat",
            data_source_class
        )


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


def alpha_list_from_request(alpha_list):
    if alpha_list.alphas:
        return AlphaList.from_json(alpha_list.alphas)
    else:
        alpha_list_obj = AlphaList.from_filepath(
            f"AlphaLists/{alpha_list.element}Alphas.dat"
        )
        alpha_list_obj.load_or_fetch()

        return alpha_list_obj


def calculate_alpha_list(
    material: Material,
    alpha_list: AlphaList,
) -> CalculationResponse:
    """Run a neucBOT alpha list calculation."""
    composition = material_composition_from_request(material)
    alphas = alpha_list_from_request(alpha_list)

    result = neucbot_runner.run(alphas, composition)
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


def chain_list_from_request(chain_list):
    if chain_list.element:
        chain_alpha_list = ChainAlphaList.from_filepath(
            f"Chains/{chain_list.element}Chain.dat"
        )
        chain_alpha_list.load_or_fetch()
        return chain_alpha_list
    else:
        return ChainAlphaList.from_json(chain_list.chain)


def calculate_chain_list(
    material: Material,
    chain_list: list,
) -> CalculationResponse:
    """Run a neucBOT decay chain calculation."""
    composition = material_composition_from_request(material)
    chain_alphas = chain_list_from_request(chain_list)

    result = neucbot_runner.run(chain_alphas, composition)

    return CalculationResponse(
        total_neutron_yield=result["total_neutron_yield"],
        spectrum_integral=result["spectrum_integral"],
        isotope_contributions=result.get("cross_sections", {}),
        neutron_spectrum=result.get("spectra_totals", {}),
    )
