import io
import pathlib
from decimal import Decimal, InvalidOperation
from datetime import datetime

from quart import Blueprint, request, jsonify, send_file
from quart_jwt_extended import jwt_required, get_jwt_identity

from server.src.models.comprovante_model import Comprovante, MetodoPagamento
from server.src.services.comprovante_service import format_sales_receipt
from server.src.services.generate_pdf import generate_html, generate_qrcode, generate_barcode
from server.src.utils.utils import read_bytes
from server.src.utils.logger import log_info, log_error, log_warn

sales = Blueprint('sales', __name__)

def safe_decimal(value, default=Decimal('0')):
    try:
        if value is None:
            return default
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return default

@sales.post('/finish')
@jwt_required
async def finish_sale():
    current_user = get_jwt_identity()
    if not current_user:
        return jsonify({"msg": "Nao autorizado"}), 401
    
    user_id = current_user.get('id')
    username = current_user.get('username', 'Usuario')
    
    data = await request.get_json()
    if not data:
        return jsonify({"msg": "Corpo da requisicao vazio"}), 400

    try:
        required_fields = ['payer', 'receiver', 'payment_type']
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            log_error(f"Campos obrigatorios ausentes")
            return jsonify({"msg": "Campos obrigatorios ausentes"}), 400

        payment_method_str = str(data.get('payment_type', 'PIX')).upper()
        
        try:
            payment_type = MetodoPagamento[payment_method_str]
        except KeyError:
            log_error(f"Metodo de pagamento invalido")
            return jsonify({"msg": "Metodo de pagamento invalido"}), 400
        
        items = data.get('items', [])
        if not isinstance(items, list) or len(items) == 0:
            return jsonify({"msg": "Itens obrigatorios"}), 400
        
        subtotal = safe_decimal(data.get('subtotal', 0))
        item_discounts_total = safe_decimal(data.get('itemDiscountsTotal', 0))
        global_discount_percent = safe_decimal(data.get('globalDiscountPercent', 0))
        global_discount_amount = safe_decimal(data.get('globalDiscountAmount', 0))
        total_amount = safe_decimal(data.get('totalAmount', 0))
        
        if subtotal < 0 or item_discounts_total < 0 or global_discount_percent < 0 or global_discount_amount < 0:
            return jsonify({"msg": "Valores nao podem ser negativos"}), 400
        
        if global_discount_percent > 100:
            return jsonify({"msg": "Percentual de desconto nao pode exceder 100%"}), 400
        
        if total_amount <= 0:
            return jsonify({"msg": "Total deve ser maior que zero"}), 400
        
        payer_nome = str(data.get('payer', {}).get('nome', 'Cliente'))[:100]
        receiver_nome = str(data.get('receiver', {}).get('nome', 'Sweet Home'))[:100]
        description = str(data.get('description', 'Venda'))[:100]
        
        comprovante = Comprovante(
            qtd=sum(item.get('quantity', 0) for item in items) if items else int(data.get('qtd', 1)),
            value=total_amount,
            payment_type=payment_type,
            payer={"nome": payer_nome},
            receiver={"nome": receiver_nome},
            description=description,
            items=items,
            subtotal=subtotal,
            itemDiscountsTotal=item_discounts_total,
            globalDiscountPercent=global_discount_percent,
            globalDiscountAmount=global_discount_amount,
            totalAmount=total_amount
        )

        log_info(f"Comprovante criado")

        path = str(pathlib.Path(__file__).parent.resolve())
        qrcode_path = generate_qrcode(path)
        barcode_path = generate_barcode(comprovante.barcode_str, path)
        
        if not qrcode_path:
            log_warn("Geracao de QR code falhou")
        if not barcode_path:
            log_warn("Geracao de barcode falhou")
        
        html_content = generate_html(comprovante, username, qrcode_path or "", barcode_path or "")
        pdf_path = format_sales_receipt(html_content, path)
        
        if not pdf_path:
            log_error("Geracao de PDF retornou None")
            return jsonify({"msg": "Erro ao gerar comprovante"}), 500
        
        pdf_bytes = read_bytes(pdf_path)
        if not pdf_bytes:
            return jsonify({"msg": "Falha ao ler arquivo PDF"}), 500
            
        pdf_buffer = io.BytesIO(pdf_bytes)

        return await send_file(
            filename_or_io=pdf_buffer,
            mimetype='application/pdf',
            attachment_filename="comprovante.pdf",
            as_attachment=True 
        )

    except Exception as e:
        log_error(f"Erro inesperado")
        return jsonify({"msg": "Erro interno do servidor"}), 500