from __future__ import annotations

import logging

from services.graph_builder import ProcessGraph
from services.uev_database import UEVDatabase


class EmergyCalculationEngine:
    """
    Motor de cálculo emergético baseado no algoritmo track-summing do SCALE
    (Marvuglia et al., 2013).

    Implementa as 3 regras da álgebra emergética via DFS recursivo:
      Regra 1 — Soma: emergias de fontes independentes são somadas.
      Regra 2 — Não-dupla-contagem: processos intermediários bifurcados
                são percorridos apenas uma vez por travessia. Fontes (SOURCE)
                nunca são bloqueadas — cada fluxo físico é somado (Regra 1).
      Regra 3 — Co-produto integral: cada co-produto recebe a emergia total
                do processo (tratado via chamadas independentes a calculate()).
    """

    def __init__(
        self,
        graph: ProcessGraph,
        uev_db: UEVDatabase,
        minflow: float = 1e-10,
    ) -> None:
        self.graph = graph
        self.uev_db = uev_db
        self.minflow = minflow
        self.logger = logging.getLogger(__name__)

    def calculate(self, target_id: int) -> float:
        target_name = self.graph.get_node_name(target_id)
        self.logger.info(
            "Iniciando cálculo emergético | alvo='%s' (id=%d) | minflow=%.2e",
            target_name, target_id, self.minflow,
        )
        visited_nodes: set[int] = set()
        total = self._dfs_emergy(target_id, 1.0, visited_nodes, set(), depth=0)
        self.logger.info(
            "Resultado final | alvo='%s' | total=%.6e sej", target_name, total,
        )
        return total

    def get_source_contributions(self, target_id: int) -> dict[str, float]:
        """
        Retorna a contribuição individual de cada fonte em sej.
        Para cada SOURCE, calcula o total com e sem ela; a diferença é sua contribuição.
        """
        contributions: dict[str, float] = {}
        source_ids = self._collect_reachable_sources(target_id)
        total = self._dfs_emergy(target_id, 1.0, set(), set(), depth=0)

        for sid in source_ids:
            total_excl = self._dfs_emergy(target_id, 1.0, set(), {sid}, depth=0)
            name = self.graph.get_node_name(sid)
            contributions[name] = max(total - total_excl, 0.0)

        self.logger.info(
            "Contribuições por fonte: %s",
            {k: f"{v:.4e}" for k, v in contributions.items()},
        )
        return contributions

    # ------------------------------------------------------------------
    # DFS recursivo
    # ------------------------------------------------------------------

    def _dfs_emergy(
        self,
        node_id: int,
        flow_fraction: float,
        visited_nodes: set[int],
        excluded_sources: set[int],
        depth: int,
    ) -> float:
        indent = "  " * depth
        name = self.graph.get_node_name(node_id)

        if flow_fraction < self.minflow:
            self.logger.debug(
                "%sPRUNED  node='%s' fraction=%.2e < minflow=%.2e",
                indent, name, flow_fraction, self.minflow,
            )
            return 0.0

        if self.graph.is_source(node_id):
            return self._handle_source(node_id, name, flow_fraction, excluded_sources, indent)

        return self._handle_process(node_id, name, flow_fraction, visited_nodes, excluded_sources, depth, indent)

    def _handle_source(
        self,
        node_id: int,
        name: str,
        flow_fraction: float,
        excluded_sources: set[int],
        indent: str,
    ) -> float:
        # Fontes excluídas (usadas em get_source_contributions para isolar contribuições)
        if node_id in excluded_sources:
            return 0.0

        uev = self.graph.get_node_uev(node_id)
        if uev is None:
            try:
                uev = self.uev_db.get_uev(name)
            except KeyError:
                self.logger.warning(
                    "%sSOURCE  '%s' sem UEV — contribuição = 0", indent, name
                )
                return 0.0

        emergy = uev * flow_fraction
        self.logger.debug(
            "%sSOURCE  '%s' | uev=%.4e | fraction=%.4e → %.4e sej",
            indent, name, uev, flow_fraction, emergy,
        )
        return emergy

    def _handle_process(
        self,
        node_id: int,
        name: str,
        flow_fraction: float,
        visited_nodes: set[int],
        excluded_sources: set[int],
        depth: int,
        indent: str,
    ) -> float:
        # Regra 2: processo já percorrido nesta travessia → bifurcação detectada, não contar novamente
        if node_id in visited_nodes:
            self.logger.debug(
                "%sSKIP    process='%s' (bifurcação — já visitado)", indent, name
            )
            return 0.0
        visited_nodes.add(node_id)

        predecessors = self.graph.get_predecessors(node_id)
        if not predecessors:
            return 0.0

        self.logger.debug(
            "%sENTER   node='%s' | fraction=%.4e | predecessores=%d",
            indent, name, flow_fraction, len(predecessors),
        )

        total_emergy = 0.0
        for pred_id, amount in predecessors:
            # Propaga o fluxo físico real de cada predecessor (J, kg, etc.)
            fraction = flow_fraction * amount
            pred_emergy = self._dfs_emergy(pred_id, fraction, visited_nodes, excluded_sources, depth + 1)
            total_emergy += pred_emergy  # Regra 1: soma de origens independentes

        self.logger.debug(
            "%sEXIT    node='%s' | subtotal=%.4e sej", indent, name, total_emergy
        )
        return total_emergy

    def _collect_reachable_sources(self, target_id: int) -> list[int]:
        """Coleta IDs de todos os nós SOURCE alcançáveis em DFS simples."""
        sources: list[int] = []
        stack = [target_id]
        seen: set[int] = set()
        while stack:
            nid = stack.pop()
            if nid in seen:
                continue
            seen.add(nid)
            if self.graph.is_source(nid):
                sources.append(nid)
            else:
                for pred_id, _ in self.graph.get_predecessors(nid):
                    stack.append(pred_id)
        return sources
