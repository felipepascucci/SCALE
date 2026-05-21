"""
Testes das 3 regras da álgebra emergética (SCALE — Marvuglia et al., 2013).

Todos os grafos são construídos em memória via ProcessGraph.add_node / add_edge,
sem dependência de banco de dados ou arquivos CSV.
"""

import pytest
from models.process import NodeType
from services.emergy_engine import EmergyCalculationEngine
from services.graph_builder import ProcessGraph
from services.uev_database import UEVDatabase


def _make_engine(graph: ProcessGraph, uevs: dict) -> EmergyCalculationEngine:
    """Cria UEVDatabase a partir de um dict {nome: valor} e retorna o engine."""
    uev_db = UEVDatabase()
    for name, value in uevs.items():
        uev_db.add_uev(name, value, "sej/J")
    return EmergyCalculationEngine(graph, uev_db)


class TestRule1Sum:
    """
    Regra 1 — Soma de co-geração:
    Fluxos de origens independentes que convergem num processo têm suas
    emergias somadas.
    """

    def test_two_independent_sources_sum(self):
        # Arrange
        #   Sol (uev=1.0, flow=1.0) ──┐
        #                              ├──► Produto
        #   Vento (uev=2.0, flow=1.0) ┘
        graph = ProcessGraph()
        graph.add_node(0, "Sol", NodeType.SOURCE)
        graph.add_node(1, "Vento", NodeType.SOURCE)
        graph.add_node(2, "Produto", NodeType.TARGET)
        graph.add_edge(0, 2, flow_amount=1.0)
        graph.add_edge(1, 2, flow_amount=1.0)

        engine = _make_engine(graph, {"Sol": 1.0, "Vento": 2.0})

        # Act
        # total_input(Produto) = 2.0
        # emergy = 1.0*(1/2) + 2.0*(1/2) = 0.5 + 1.0 = 1.5
        total = engine.calculate(2)
        contributions = engine.get_source_contributions(2)

        # Assert: valor total e decomposição consistentes
        assert abs(total - 1.5) < 1e-9
        assert abs(contributions["Sol"] + contributions["Vento"] - total) < 1e-9
        assert contributions["Sol"] > 0
        assert contributions["Vento"] > 0


class TestRule2NoDoubleCounting:
    """
    Regra 2 — Não-dupla-contagem:
    O mesmo fluxo original chegando por dois caminhos paralelos
    (bifurcação anterior) é contado apenas uma vez.
    """

    def test_bifurcated_source_not_double_counted(self):
        # Arrange
        #   Sol ──► B ──(0.5)──► C ──(0.5)──┐
        #                └──(0.5)──► D ──(0.5)──┴──► E
        #
        # Sem Regra 2 (dupla contagem): 0.5 + 0.5 = 1.0
        # Com Regra 2 (Sol contado 1×): 0.5
        graph = ProcessGraph()
        graph.add_node(0, "Sol", NodeType.SOURCE)
        graph.add_node(1, "Processo_B", NodeType.PROCESS)
        graph.add_node(2, "Processo_C", NodeType.PROCESS)
        graph.add_node(3, "Processo_D", NodeType.PROCESS)
        graph.add_node(4, "Produto_Final", NodeType.TARGET)

        graph.add_edge(0, 1, flow_amount=1.0)
        graph.add_edge(1, 2, flow_amount=0.5)
        graph.add_edge(1, 3, flow_amount=0.5)
        graph.add_edge(2, 4, flow_amount=0.5)
        graph.add_edge(3, 4, flow_amount=0.5)

        engine = _make_engine(graph, {"Sol": 1.0})

        # Act
        total = engine.calculate(4)

        # Assert
        double_counted_value = 1.0
        assert total < double_counted_value, (
            f"Dupla contagem detectada: total={total} deve ser < {double_counted_value}"
        )
        assert abs(total - 0.5) < 1e-9, (
            f"Esperado 0.5 (Sol contado uma vez), obtido {total}"
        )


class TestRule3CoproductIntegral:
    """
    Regra 3 — Co-produto integral:
    Em processos com múltiplas saídas, cada co-produto recebe a emergia
    total do processo (sem rateio).
    """

    def test_coproducts_receive_full_process_emergy(self):
        # Arrange
        #   Sol (uev=1.0) ──► Processo_B ──(1.0)──► Produto_C
        #                                └──(1.0)──► Produto_D
        #
        # Se houvesse rateio (errado): emergy_C = emergy_D = 0.5
        # Com Regra 3 (correto):       emergy_C = emergy_D = 1.0
        graph = ProcessGraph()
        graph.add_node(0, "Sol", NodeType.SOURCE)
        graph.add_node(1, "Processo_B", NodeType.PROCESS)
        graph.add_node(2, "Produto_C", NodeType.TARGET)
        graph.add_node(3, "Produto_D", NodeType.TARGET)

        graph.add_edge(0, 1, flow_amount=1.0)
        graph.add_edge(1, 2, flow_amount=1.0)
        graph.add_edge(1, 3, flow_amount=1.0)

        engine = _make_engine(graph, {"Sol": 1.0})

        # Act — calculate() independente por co-produto implementa a Regra 3
        emergy_c = engine.calculate(2)
        emergy_d = engine.calculate(3)

        # Assert
        assert abs(emergy_c - 1.0) < 1e-9, (
            f"Produto_C deveria receber emergia integral 1.0, obtido {emergy_c}"
        )
        assert abs(emergy_d - 1.0) < 1e-9, (
            f"Produto_D deveria receber emergia integral 1.0, obtido {emergy_d}"
        )
        assert abs(emergy_c - emergy_d) < 1e-9, (
            "Co-produtos devem receber a mesma emergia total do processo"
        )
        # Garante explicitamente que não houve rateio (0.5 seria o rateio)
        assert emergy_c > 0.5
        assert emergy_d > 0.5
