from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.v1.projects import router as projects_router
from api.v1.uevs import router as uevs_router
from core.config import settings  # noqa: F401

app = FastAPI(title="APSScale API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(uevs_router, prefix="/api/v1/uevs", tags=["uevs"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
