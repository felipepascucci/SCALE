from pydantic import BaseModel


class CalculationResponse(BaseModel):
    target_name: str
    total_emergy_sej: float
    contributions_by_source: dict[str, float]
    minflow_threshold: float
    emergy_cut_pct: float
