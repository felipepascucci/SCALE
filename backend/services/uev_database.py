class UEVDatabase:
    def __init__(self):
        self._store: dict[str, dict] = {}

    def add_uev(self, name: str, value: float, unit: str, reference: str = "") -> None:
        self._store[name] = {"value": value, "unit": unit, "reference": reference}

    def get_uev(self, name: str) -> float:
        if name not in self._store:
            raise KeyError(f"UEV não encontrado: '{name}'")
        return self._store[name]["value"]

    def list_resources(self) -> list[str]:
        return list(self._store.keys())

    def load_defaults(self) -> None:
        """Carrega valores de referência (Odum 1996 / Brown & Ulgiati)."""
        defaults = [
            ("Sol",               1.0,      "sej/J",  "Odum 1996"),
            ("Vento",             2450.0,   "sej/J",  "Odum 1996"),
            ("Chuva-quimica",     30500.0,  "sej/J",  "Odum 1996"),
            ("Chuva-geopotencial",8900.0,   "sej/J",  "Odum 1996"),
            ("Geotermico",        12000.0,  "sej/J",  "Odum 1996"),
            ("Mares",             16800.0,  "sej/J",  "Odum 1996"),
        ]
        for name, value, unit, ref in defaults:
            self.add_uev(name, value, unit, ref)
