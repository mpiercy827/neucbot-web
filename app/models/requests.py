from pydantic import BaseModel, Field, model_validator
from typing import Optional


class MaterialIsotope(BaseModel):
    """A single isotope entry in a material composition."""

    symbol: str = Field(
        ..., description="Chemical symbol of the element (e.g. 'C', 'O')"
    )
    mass_number: int = Field(
        ...,
        description="Mass number of the isotope. Use 0 to include all natural isotopes at natural abundance.",
    )
    mass_fraction: float = Field(
        ..., gt=0, description="Percent mass fraction of this isotope in the material"
    )


class Material(BaseModel):
    name: Optional[str] = None

    isotopes: Optional[list[MaterialIsotope]] = None

    @model_validator(mode="before")
    @classmethod
    def check_mutually_exclusive(cls, data):
        if data.get("name") and data.get("isotopes"):
            raise ValueError("Expected either 'name' and 'isotopes', not both")
        elif not data.get("name") and not data.get("isotopes"):
            raise ValueError("Expected one of: 'name' and 'isotopes'")

        return data


class AlphaList(BaseModel):
    """An alpha list object."""

    element: Optional[str] = None

    alphas: Optional[dict[float, float]] = None

    @model_validator(mode="before")
    @classmethod
    def check_mutually_exclusive(cls, data):
        if data.get("alphas") and data.get("element"):
            raise ValueError("Expected either 'alphas' and 'element', not both")
        elif not data.get("alphas") and not data.get("element"):
            raise ValueError("Expected one of: 'alphas' and 'element'")

        return data


class AlphaListRequest(BaseModel):
    material: Material = Field(
        ..., description="List of isotopes making up the target material"
    )
    alpha_list: AlphaList = Field(
        ..., description="List of alpha energies and their probabilities, or an element"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "material": [
                        {"symbol": "C", "mass_number": 0, "mass_fraction": 59.984},
                        {"symbol": "O", "mass_number": 0, "mass_fraction": 31.962},
                        {"symbol": "H", "mass_number": 0, "mass_fraction": 8.054},
                    ],
                    "alpha_list": {
                        "alphas": {
                            6.7783: 99.9981,
                            5.985: 0.0019,
                        }
                    },
                }
            ]
        }
    }


class ChainList(BaseModel):
    """An alpha list object."""

    element: Optional[str] = None

    chain: Optional[dict[str, float]] = None

    @model_validator(mode="before")
    @classmethod
    def check_mutually_exclusive(cls, data):
        if data.get("chain") and data.get("element"):
            raise ValueError("Expected either 'chain' and 'element', not both")
        elif not data.get("chain") and not data.get("element"):
            raise ValueError("Expected one of: 'chain' and 'element'")

        return data


class ChainListRequest(BaseModel):
    material: Material = Field(
        ..., description="List of isotopes making up the target material"
    )
    chain_list: ChainList = Field(
        ...,
        description="Map of decay chain isotopes to branching ratios, or an element of a preloaded chain",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "material": [
                        {"symbol": "C", "mass_number": 0, "mass_fraction": 59.984},
                        {"symbol": "O", "mass_number": 0, "mass_fraction": 31.962},
                        {"symbol": "H", "mass_number": 0, "mass_fraction": 8.054},
                    ],
                    "chain_list": {
                        "chain": {
                            "Th232": 100,
                            "Th228": 100,
                            "Ra224": 100,
                            "Rn220": 100,
                            "Po216": 100,
                            "Bi212": 35.94,
                            "Po212": 64.06,
                        },
                    },
                }
            ]
        }
    }
