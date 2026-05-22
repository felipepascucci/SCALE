from __future__ import annotations

from typing import TYPE_CHECKING

import networkx as nx

from models.process import NodeType
from services.lci_matrix import LCIMatrix

if TYPE_CHECKING:
    from models.flow import Flow
    from models.process import Process


class ProcessGraph:
    """Grafo orientado de processos LCI, construído sobre networkx.DiGraph."""

    def __init__(self) -> None:
        self._graph: nx.DiGraph = nx.DiGraph()

    # ------------------------------------------------------------------
    # Construção manual (nó a nó)
    # ------------------------------------------------------------------

    def add_node(
        self,
        node_id: int,
        name: str,
        node_type: NodeType,
        uev: float | None = None,
    ) -> None:
        self._graph.add_node(node_id, name=name, node_type=node_type, uev=uev)

    def add_edge(
        self,
        source_id: int,
        target_id: int,
        flow_amount: float,
        flow_unit: str = "kg",
    ) -> None:
        self._graph.add_edge(
            source_id, target_id, flow_amount=flow_amount, flow_unit=flow_unit
        )

    # ------------------------------------------------------------------
    # Construção a partir da matriz LCI
    # ------------------------------------------------------------------

    def build_from_lci(
        self,
        lci: LCIMatrix,
        source_ids: list[int],
        target_id: int,
        uev_map: dict[int, float] | None = None,
    ) -> None:
        """
        Constrói o grafo a partir de uma LCIMatrix.

        uev_map: mapeamento opcional {process_idx: uev_value} para nós SOURCE.
        """
        uev_map = uev_map or {}
        n = len(lci.processes)

        for i, name in enumerate(lci.processes):
            if i in source_ids:
                ntype = NodeType.SOURCE
            elif i == target_id:
                ntype = NodeType.TARGET
            else:
                ntype = NodeType.PROCESS
            self.add_node(i, name=name, node_type=ntype, uev=uev_map.get(i))

        for j, predecessors in lci.get_adjacency(set(source_ids)).items():
            for k, amount in predecessors:
                self.add_edge(k, j, flow_amount=amount)

    # ------------------------------------------------------------------
    # Construção a partir de ORM objects (uso via rotas futuras)
    # ------------------------------------------------------------------

    def build_from_db_records(
        self, processes: list["Process"], flows: list["Flow"]
    ) -> None:
        for p in processes:
            uev_value = p.uev.value if p.uev else None
            self.add_node(p.id, name=p.name, node_type=p.node_type, uev=uev_value)
        for f in flows:
            self.add_edge(
                f.source_process_id,
                f.target_process_id,
                flow_amount=f.flow_amount,
                flow_unit=f.flow_unit,
            )

    # ------------------------------------------------------------------
    # Consultas
    # ------------------------------------------------------------------

    def get_predecessors(self, node_id: int) -> list[tuple[int, float]]:
        return [
            (pred, data["flow_amount"])
            for pred, _, data in self._graph.in_edges(node_id, data=True)
        ]

    def get_total_input(self, node_id: int) -> float:
        return sum(
            data["flow_amount"]
            for _, _, data in self._graph.in_edges(node_id, data=True)
        )

    def is_source(self, node_id: int) -> bool:
        return self._graph.nodes[node_id]["node_type"] == NodeType.SOURCE

    def get_node_name(self, node_id: int) -> str:
        return self._graph.nodes[node_id]["name"]

    def get_node_uev(self, node_id: int) -> float | None:
        return self._graph.nodes[node_id].get("uev")
