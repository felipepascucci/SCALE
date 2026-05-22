from __future__ import annotations

from pydantic import BaseModel


class UEVResponse(BaseModel):
    id: int
    name: str
    value: float
    unit: str
    reference: str | None

    model_config = {"from_attributes": True}


class UEVCreate(BaseModel):
    name: str
    value: float
    unit: str
    reference: str = ""


class UEVUpdate(BaseModel):
    value: float
    unit: str
