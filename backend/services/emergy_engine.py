import logging

from services.graph_builder import ProcessGraph
from services.uev_database import UEVDatabase


class EmergyCalculationEngine:
    """
    Motor de cálculo emergético baseado no algoritmo track-summing do SCALE
    (Marvuglia et al., 2013).

    Implementa as 3 regras da álgebra emergética via DFS recursivo:
      Regra 1 — Soma: emergias de fontes independentes são somadas.
      Regra 2 — Não-dupla-contagem: o mesmo fluxo chegando por caminhos
                paralelos (bifurcação) é contado apenas uma vez.
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
        visited_sources: set[int] = set()
        total = self._dfs_emergy(target_id, 1.0, visited_sources, depth=0)
        self.logger.info(
            "Resultado final | alvo='%s' | total=%.6e sej | fontes contadas=%d",
            target_name, total, len(visited_sources),
        )
        return total

    def get_source_contributions(self, target_id: int) -> dict[str, float]:
        """
        Retorna a contribuição individual de cada fonte em sej.
        Executa o DFS uma vez por fonte para isolar sua contribuição.
        """
        contributions: dict[str, float] = {}

        # Coleta IDs de todos os nós SOURCE alcançáveis a partir do alvo
        source_ids = self._collect_reachable_sources(target_id)

        for sid in source_ids:
            # Calcula a emergia total e extrai só a parte desta fonte
            visited: set[int] = set()
            total = self._dfs_emergy(target_id, 1.0, visited, depth=0)
            # Se a fonte foi visitada, its contribution = total minus run without it
            visited_excl: set[int] = {sid}
            total_excl = self._dfs_emergy(target_id, 1.0, visited_excl, depth=0)
            contribution = total - total_excl
            name = self.graph.get_node_name(sid)
            contributions[name] = max(contribution, 0.0)

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
        visited_sources: set[int],
        depth: int,
    ) -> float:
        indent = "  " * depth
        name = self.graph.get_node_name(node_id)

        # Poda por limiar — evita explosão computacional em ciclos
        if flow_fraction < self.minflow:
            self.logger.debug(
                "%sPRUNED  node='%s' fraction=%.2e < minflow=%.2e",
                indent, name, flow_fraction, self.minflow,
            )
            return 0.0

        if self.graph.is_source(node_id):
            return self._handle_source(node_id, name, flow_fraction, visited_sources, indent)

        return self._handle_process(node_id, name, flow_fraction, visited_sources, depth, indent)

    def _handle_source(
        self,
        node_id: int,
        name: str,
        flow_fraction: float,
        visited_sources: set[int],
        indent: str,
    ) -> float:
        # Regra 2: não conta a mesma fonte duas vezes na mesma travessia
        if node_id in visited_sources:
            self.logger.debug(
                "%sSKIP    source='%s' (já contado nesta travessia)", indent, name
            )
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
        visited_sources.add(node_id)
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
        visited_sources: set[int],
        depth: int,
        indent: str,
    ) -> float:
        predecessors = self.graph.get_predecessors(node_id)
        if not predecessors:
            return 0.0

        total_input = self.graph.get_total_input(node_id)
        self.logger.debug(
            "%sENTER   node='%s' | fraction=%.4e | predecessores=%d",
            indent, name, flow_fraction, len(predecessors),
        )

        total_emergy = 0.0
        for pred_id, amount in predecessors:
            # Propaga a fração proporcional ao fluxo de cada predecessor
            fraction = flow_fraction * (amount / total_input) if total_input > 0 else flow_fraction
            # visited_sources é passado por referência — ramos paralelos compartilham
            # o mesmo set, implementando a Regra 2 automaticamente
            pred_emergy = self._dfs_emergy(pred_id, fraction, visited_sources, depth + 1)
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
