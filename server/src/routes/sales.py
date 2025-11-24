import io
import pathlib
import logging
from decimal import Decimal

from quart import Blueprint, request, jsonify, send_file
from quart_jwt_extended import jwt_required, get_jwt_identity

from models.comprovante_model import Comprovante, MetodoPagamento
from services.comprovante_service import format_sales_receipt
from services.generate_pdf import generate_html, generate_qrcode, generate_barcode
from utils.utils import read_bytes

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

sales = Blueprint('sales', __name__)

@sales.post('/finish')
@jwt_required
async def finish_sale():
    """Process and generate receipt PDF for completed sale."""
    current_user = get_jwt_identity()
    if not current_user:
        return jsonify({"msg": "Unauthorized"}), 401
    
    path = str(pathlib.Path(__file__).parent.resolve())
    logging.debug(f"Using base path: {path}")

    data = await request.get_json()
    if not data:
        return jsonify({"msg": "Request body cannot be empty"}), 400

    try:
        payment_method_str = data.get('payment_type', 'PIX').upper()
        payment_type = MetodoPagamento[payment_method_str]

        comprovante = Comprovante(
            qtd=data.get('qtd'),
            value=Decimal(str(data.get('value'))),
            payment_type=payment_type,
            payer={"nome": data.get('payer')},
            receiver={"nome": data.get('receiver')},
            description=data.get('description')
        )

        html_content = generate_html(comprovante, generate_qrcode(path), generate_barcode("Pedro Apelao", path))
        
        pdf_path = format_sales_receipt(html_content, path)
        
        if not pdf_path:
            logging.error("PDF path generation returned None")
            return jsonify({"msg": "Internal error generating receipt"}), 500
        
        pdf_bytes = read_bytes(pdf_path)
        pdf_buffer = io.BytesIO(pdf_bytes)
        logging.debug(pdf_buffer)

        return await send_file(
            filename_or_io=pdf_buffer,
            mimetype='application/pdf',
            attachment_filename="comprovante.pdf",
            as_attachment=True 
        )

    except (KeyError, TypeError, ValueError) as e:
        logging.error(f"Input data error: {e}")
        return jsonify({"msg": f"Invalid request data: {e}"}), 400
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return jsonify({"msg": "Unexpected server error."}), 500