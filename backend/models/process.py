import enum
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base

if TYPE_CHECKING:
    from models.flow import Flow
    from models.project import Project
    from models.uev import UEV


class NodeType(str, enum.Enum):
    SOURCE = "source"
    PROCESS = "process"
    TARGET = "target"


class Process(Base):
    __tablename__ = "processes"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    name: Mapped[str] = mapped_column(String(255))
    node_type: Mapped[NodeType] = mapped_column(SQLEnum(NodeType))
    uev_id: Mapped[Optional[int]] = mapped_column(ForeignKey("uevs.id"), nullable=True)

    project: Mapped["Project"] = relationship(back_populates="processes")
    uev: Mapped[Optional["UEV"]] = relationship()
    outgoing_flows: Mapped[List["Flow"]] = relationship(
        foreign_keys="Flow.source_process_id", back_populates="source_process"
    )
    incoming_flows: Mapped[List["Flow"]] = relationship(
        foreign_keys="Flow.target_process_id", back_populates="target_process"
    )
