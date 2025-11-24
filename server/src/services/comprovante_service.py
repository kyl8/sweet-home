import logging
import json
import os
import pathlib
from decimal import Decimal
from enum import Enum

from fpdf import FPDF

from models.comprovante_model import Comprovante, MetodoPagamento 
from services.generate_pdf import generate_html, generate_qrcode, generate_barcode

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
path = str(pathlib.Path(__file__).parent.resolve())

def convert_sub_objects(obj):
    """Convert complex objects to JSON-serializable format."""
    if hasattr(obj, '__dict__'):
        return obj.__dict__

    if isinstance(obj, Decimal):
        return str(obj)

    if isinstance(obj, Enum):
        return obj.value
    
def generate_json_to_api(data):
    """Serialize object to JSON string with custom converters."""
    logging.debug(f"Serializing object: {data}")
    json_data = json.dumps(
        data, 
        default=convert_sub_objects,
        indent=4,
    )
    return json_data
    
def format_sales_receipt(string, path):
    """Generate PDF from HTML content and save to file."""
    comprovante_dir = os.path.join(path, 'comprovante')
    os.makedirs(comprovante_dir, exist_ok=True)
    pdf_path = os.path.join(comprovante_dir, 'comprovante.pdf')

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font('helvetica', size=12)
    try:
        pdf.write_html(string)
        pdf.output(pdf_path)
        logging.info(f"PDF saved at: {pdf_path}")
        return pdf_path
    except Exception as e:
        logging.error(f"PDF generation error: {e}")
        return None

if __name__ == "__main__":
    comprovante = Comprovante(
        qtd=1,
        value=Decimal(1),
        payment_type=MetodoPagamento.PIX,
        payer={"nome": '1'},
        receiver={"nome": '1'},
        description='1'
    )
    html_content = generate_html(comprovante, generate_qrcode(path), generate_barcode("111111111111111111111", path))
    print(len(html_content))
    format_sales_receipt(generate_html(comprovante, generate_qrcode(path), generate_barcode("11111111111111111", path)), path)