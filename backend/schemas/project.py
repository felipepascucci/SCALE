from datetime import datetime

from pydantic import BaseModel


class ProjectUploadResponse(BaseModel):
    project_id: int
    name: str
    process_count: int
    flow_count: int


class ProjectListResponse(BaseModel):
    id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}
