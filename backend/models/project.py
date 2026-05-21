from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base

if TYPE_CHECKING:
    from models.flow import Flow
    from models.process import Process


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    processes: Mapped[List["Process"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    flows: Mapped[List["Flow"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
