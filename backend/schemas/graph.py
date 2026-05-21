from pydantic import BaseModel


class NodePosition(BaseModel):
    x: float
    y: float


class NodeData(BaseModel):
    label: str
    node_type: str


class NodeSchema(BaseModel):
    id: str
    type: str = "default"
    data: NodeData
    position: NodePosition


class EdgeSchema(BaseModel):
    id: str
    source: str
    target: str
    label: str


class GraphResponse(BaseModel):
    nodes: list[NodeSchema]
    edges: list[EdgeSchema]
