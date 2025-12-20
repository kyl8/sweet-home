import uuid
from dataclasses import field, dataclass
from decimal import Decimal
from enum import Enum
from typing import Dict, Any, Optional, List

from services.register_service import timestamp
from utils.utils import generate_numeric_id_from_string

class MetodoPagamento(str, Enum):
    PIX = "PIX"
    DINHEIRO = "DINHEIRO"

@dataclass
class Comprovante:
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
    items: Optional[List[Dict[str, Any]]] = None
    subtotal: Optional[Decimal] = None
    itemDiscountsTotal: Optional[Decimal] = None
    globalDiscountPercent: Optional[Decimal] = None
    globalDiscountAmount: Optional[Decimal] = None
    totalAmount: Optional[Decimal] = None

    def __post_init__(self):
        payer_name = self.payer.get("nome", "")
        self.barcode_str = generate_numeric_id_from_string(
            payer_name,
            str(uuid.uuid4()),
            str(self.transaction_id)
        )
        
        if self.items:
            self.qtd = sum(item.get('quantity', 0) for item in self.items)
            self.value = Decimal(str(self.totalAmount)) if self.totalAmount else Decimal(0)

    @property
    def unit_price(self) -> Decimal:
        return self.value / self.qtd if self.qtd > 0 else Decimal(0)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "qtd": self.qtd,
            "value": float(self.value),
            "payment_type": self.payment_type.value,
            "payer": self.payer,
            "receiver": self.receiver,
            "transaction_id": str(self.transaction_id),
            "timestamp": self.timestamp,
            "currency": self.currency,
            "description": self.description,
            "barcode_str": self.barcode_str,
            "items": self.items,
            "subtotal": float(self.subtotal) if self.subtotal else None,
            "itemDiscountsTotal": float(self.itemDiscountsTotal) if self.itemDiscountsTotal else None,
            "globalDiscountPercent": float(self.globalDiscountPercent) if self.globalDiscountPercent else None,
            "globalDiscountAmount": float(self.globalDiscountAmount) if self.globalDiscountAmount else None,
            "totalAmount": float(self.totalAmount) if self.totalAmount else None
        }
