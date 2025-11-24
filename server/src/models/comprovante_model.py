import uuid
from dataclasses import field, dataclass
from decimal import Decimal
from enum import Enum
from typing import Dict, Any, Optional

from services.register_service import timestamp
from utils.utils import generate_numeric_id_from_string

class MetodoPagamento(str, Enum):
    PIX = "PIX"
    DINHEIRO = "DINHEIRO"

@dataclass
class Comprovante:
    """Receipt/Voucher model for sales transactions."""
    qtd: int
    value: Decimal
    payment_type: MetodoPagamento
    payer: Dict[str, Any]
    receiver: Dict[str, Any]

    transaction_id: uuid.UUID = field(default_factory=uuid.uuid4)
    timestamp: str = field(default_factory=timestamp)
    currency: str = "BRL"
    description: Optional[str] = None

    barcode_str: str = field(init=False)

    def __post_init__(self):
        payer_name = self.payer.get("nome", "") 
        self.barcode_str = generate_numeric_id_from_string(payer_name)
