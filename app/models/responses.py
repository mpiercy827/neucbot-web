from pydantic import BaseModel, Field

class CalculationResponse(BaseModel):
    """
    Maps directly to NeucbotRunner.run()'s output dict:
      {
        "total_neutron_yield": float,
        "spectrum_integral": float,
        "cross_sections": { "C12": float, ... },
        "spectra_totals": { 100: float, 200: float, ... },  # keys are keV ints
      }
    """

    total_neutron_yield: float = Field(
        ..., description="Total neutron yield per decay (n/decay)"
    )
    spectrum_integral: float = Field(
        ..., description="Integral of the neutron energy spectrum (n/decay)"
    )
    isotope_contributions: dict[str,float] = Field(
        ..., description="Per-isotope breakdown of neutron yield (from 'cross_sections')"
    )
    neutron_spectrum: dict[float, float] = Field(
        ..., description="Neutron energy spectrum bins, sorted by energy (from 'spectra_totals')"
    )
