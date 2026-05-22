import numpy as np
import pandas as pd


class LCIMatrix:
    """
    Encapsula a matriz tecnológica A (n x n) de um inventário LCI.

    Convenção:
      A[i][j] > 0 → processo j PRODUZ produto i
      A[i][j] < 0 → processo j CONSOME produto i
    """

    def __init__(self) -> None:
        self.A: np.ndarray = np.empty((0, 0))
        self.products: list[str] = []
        self.processes: list[str] = []

    def load_from_dataframe(self, df: pd.DataFrame) -> None:
        """Carrega a matriz a partir de um DataFrame (linhas=produtos, colunas=processos)."""
        self.products = list(df.index.astype(str))
        self.processes = list(df.columns.astype(str))
        self.A = df.values.astype(float)

    def get_process_output(self, process_idx: int, product_idx: int) -> float:
        return float(self.A[product_idx, process_idx])

    def get_adjacency(self, source_indices: set[int] | None = None) -> dict[int, list[tuple[int, float]]]:
        """
        Retorna lista de adjacência: {processo_j: [(produtor_k, weight), ...]}

        Para nós SOURCE: weight = quantidade física bruta consumida (para multiplicar pelo UEV).
        Para processos intermediários: weight = fração normalizada (consumido / produzido),
        alinhado com SCALE (Marvuglia et al., 2013) — evita multiplicação explosiva de
        quantidades físicas ao longo de caminhos multi-nível.
        """
        source_indices = source_indices or set()
        n = len(self.processes)
        adj: dict[int, list[tuple[int, float]]] = {j: [] for j in range(n)}

        for j in range(n):
            for i in range(n):
                if self.A[i, j] < 0:
                    amount_consumed = abs(self.A[i, j])
                    producers = [k for k in range(n) if self.A[i, k] > 0]
                    for k in producers:
                        if k in source_indices:
                            weight = amount_consumed  # quantidade física bruta (será × UEV)
                        else:
                            weight = amount_consumed / self.A[i, k]  # fração normalizada [0,1]
                        adj[j].append((k, weight))

        return adj
