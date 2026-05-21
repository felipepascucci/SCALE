from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from models.uev import UEV
from schemas.uev import UEVCreate, UEVResponse, UEVUpdate

router = APIRouter()


@router.get("/", response_model=list[UEVResponse])
def list_uevs(db: Session = Depends(get_db)):
    return db.query(UEV).order_by(UEV.name).all()


@router.post("/", response_model=UEVResponse, status_code=201)
def create_uev(payload: UEVCreate, db: Session = Depends(get_db)):
    if db.query(UEV).filter(UEV.name == payload.name).first():
        raise HTTPException(status_code=409, detail=f"UEV '{payload.name}' já existe.")
    uev = UEV(**payload.model_dump())
    db.add(uev)
    db.commit()
    db.refresh(uev)
    return uev


@router.put("/{uev_id}", response_model=UEVResponse)
def update_uev(uev_id: int, payload: UEVUpdate, db: Session = Depends(get_db)):
    uev = db.get(UEV, uev_id)
    if not uev:
        raise HTTPException(status_code=404, detail="UEV não encontrado.")
    uev.value = payload.value
    uev.unit = payload.unit
    db.commit()
    db.refresh(uev)
    return uev
