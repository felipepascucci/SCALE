from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base

if TYPE_CHECKING:
    from models.process import Process
    from models.project import Project


class Flow(Base):
    __tablename__ = "flows"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    source_process_id: Mapped[int] = mapped_column(ForeignKey("processes.id"))
    target_process_id: Mapped[int] = mapped_column(ForeignKey("processes.id"))
    flow_amount: Mapped[float] = mapped_column(Float)
    flow_unit: Mapped[str] = mapped_column(String(50), default="kg")

    project: Mapped["Project"] = relationship(back_populates="flows")
    source_process: Mapped["Process"] = relationship(
        foreign_keys=[source_process_id], back_populates="outgoing_flows"
    )
    target_process: Mapped["Process"] = relationship(
        foreign_keys=[target_process_id], back_populates="incoming_flows"
    )
