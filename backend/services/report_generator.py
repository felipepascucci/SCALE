from dataclasses import dataclass, field

from services.emergy_engine import EmergyCalculationEngine
from services.graph_builder import ProcessGraph


@dataclass
class EmergencyReport:
    target_name: str
    total_emergy_sej: float
    contributions_by_source: dict[str, float] = field(default_factory=dict)
    minflow_threshold: float = 1e-10
    emergy_cut_pct: float = 0.0


class ReportGenerator:
    def __init__(self, graph: ProcessGraph, engine: EmergyCalculationEngine) -> None:
        self.graph = graph
        self.engine = engine

    def generate(self, target_id: int) -> EmergencyReport:
        target_name = self.graph.get_node_name(target_id)
        total = self.engine.calculate(target_id)
        contributions = self.engine.get_source_contributions(target_id)

        accounted = sum(contributions.values())
        cut_pct = ((total - accounted) / total * 100) if total > 0 else 0.0

        return EmergencyReport(
            target_name=target_name,
            total_emergy_sej=total,
            contributions_by_source=contributions,
            minflow_threshold=self.engine.minflow,
            emergy_cut_pct=round(cut_pct, 4),
        )
