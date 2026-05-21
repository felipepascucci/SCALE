import io

import pandas as pd
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from core.database import get_db
from models.flow import Flow
from models.process import NodeType, Process
from models.project import Project
from models.uev import UEV
from schemas.calculation import CalculationResponse
from schemas.graph import EdgeSchema, GraphResponse, NodeData, NodePosition, NodeSchema
from schemas.project import ProjectListResponse, ProjectUploadResponse
from services.emergy_engine import EmergyCalculationEngine
from services.graph_builder import ProcessGraph
from services.lci_matrix import LCIMatrix
from services.uev_database import UEVDatabase

router = APIRouter()

_TEMPLATE_CSV = """,Sol,Vento,Chuva-quimica,Processo_Prod,Produto_Final
Sol,1,0,0,-30000,0
Vento,0,1,0,-12,0
Chuva-quimica,0,0,1,-1,0
Processo_Prod,0,0,0,1,-1
Produto_Final,0,0,0,0,1
"""


def _read_dataframe(filename: str, content: bytes) -> pd.DataFrame:
    if filename.endswith(".csv"):
        return pd.read_csv(io.BytesIO(content), index_col=0)
    if filename.endswith((".xlsx", ".xls")):
        return pd.read_excel(io.BytesIO(content), index_col=0)
    raise HTTPException(status_code=400, detail="Formato não suportado. Use .csv ou .xlsx.")


def _infer_node_types(adj: dict[int, list]) -> dict[int, NodeType]:
    n = len(adj)
    successors: dict[int, list[int]] = {j: [] for j in range(n)}
    for j, preds in adj.items():
        for k, _ in preds:
            successors[k].append(j)

    types: dict[int, NodeType] = {}
    for j in range(n):
        if not adj[j]:
            types[j] = NodeType.SOURCE
        elif not successors[j]:
            types[j] = NodeType.TARGET
        else:
            types[j] = NodeType.PROCESS
    return types


@router.get("", response_model=list[ProjectListResponse])
def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).order_by(Project.created_at.desc()).all()


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")
    db.delete(project)
    db.commit()


@router.get("/template")
def download_template():
    return StreamingResponse(
        iter([_TEMPLATE_CSV]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=template_lci.csv"},
    )


@router.post("/upload", response_model=ProjectUploadResponse)
async def upload_lci(
    name: str = Form(...),
    file: UploadFile = ...,
    db: Session = Depends(get_db),
):
    content = await file.read()
    try:
        df = _read_dataframe(file.filename or "", content)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Erro ao ler arquivo: {exc}")

    lci = LCIMatrix()
    lci.load_from_dataframe(df)

    adj = lci.get_adjacency()
    node_types = _infer_node_types(adj)

    project = Project(name=name)
    db.add(project)
    db.flush()

    idx_to_db_id: dict[int, int] = {}
    for idx, proc_name in enumerate(lci.processes):
        process = Process(
            project_id=project.id,
            name=proc_name,
            node_type=node_types[idx],
        )
        db.add(process)
        db.flush()
        idx_to_db_id[idx] = process.id

    flow_count = 0
    for target_idx, preds in adj.items():
        for source_idx, amount in preds:
            flow = Flow(
                project_id=project.id,
                source_process_id=idx_to_db_id[source_idx],
                target_process_id=idx_to_db_id[target_idx],
                flow_amount=float(amount),
                flow_unit="kg",
            )
            db.add(flow)
            flow_count += 1

    db.commit()

    return ProjectUploadResponse(
        project_id=project.id,
        name=project.name,
        process_count=len(lci.processes),
        flow_count=flow_count,
    )


@router.get("/{project_id}/graph", response_model=GraphResponse)
def get_graph(project_id: int, db: Session = Depends(get_db)):
    processes = db.query(Process).filter(Process.project_id == project_id).all()
    flows = db.query(Flow).filter(Flow.project_id == project_id).all()

    if not processes:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")

    nodes = [
        NodeSchema(
            id=str(p.id),
            data=NodeData(label=p.name, node_type=p.node_type.value),
            position=NodePosition(x=0.0, y=0.0),
        )
        for p in processes
    ]

    edges = [
        EdgeSchema(
            id=f"e{f.source_process_id}-{f.target_process_id}",
            source=str(f.source_process_id),
            target=str(f.target_process_id),
            label=f"{f.flow_amount} {f.flow_unit}",
        )
        for f in flows
    ]

    return GraphResponse(nodes=nodes, edges=edges)


@router.post("/{project_id}/calculate", response_model=CalculationResponse)
def calculate_emergy(project_id: int, db: Session = Depends(get_db)):
    processes = db.query(Process).filter(Process.project_id == project_id).all()
    flows = db.query(Flow).filter(Flow.project_id == project_id).all()

    if not processes:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")

    targets = [p for p in processes if p.node_type == NodeType.TARGET]
    if not targets:
        raise HTTPException(status_code=422, detail="Nenhum nó TARGET encontrado no projeto.")

    graph = ProcessGraph()
    graph.build_from_db_records(processes, flows)

    # Carrega UEVs do banco para refletir edições do usuário
    uev_db = UEVDatabase()
    for uev_row in db.query(UEV).all():
        uev_db.add_uev(uev_row.name, uev_row.value, uev_row.unit, uev_row.reference or "")
    if not uev_db.list_resources():
        uev_db.load_defaults()

    engine = EmergyCalculationEngine(graph, uev_db)
    target_id = targets[0].id

    total = engine.calculate(target_id)
    contributions = engine.get_source_contributions(target_id)

    accounted = sum(contributions.values())
    cut_pct = round(((total - accounted) / total * 100) if total > 0 else 0.0, 4)

    return CalculationResponse(
        target_name=targets[0].name,
        total_emergy_sej=total,
        contributions_by_source=contributions,
        minflow_threshold=engine.minflow,
        emergy_cut_pct=cut_pct,
    )
