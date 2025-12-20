import logging
import json
import os
from decimal import Decimal
from enum import Enum
from pathlib import Path
from fpdf import FPDF
from utils.logger import log_debug, log_info, log_error

MAX_PDF_SIZE = 5 * 1024 * 1024
MAX_HTML_SIZE = 500 * 1024

def convert_sub_objects(obj):
    if hasattr(obj, '__dict__'):
        return obj.__dict__
    if isinstance(obj, Decimal):
        return str(obj)
    if isinstance(obj, Enum):
        return obj.value
    return obj

def generate_json_to_api(data):
    log_debug(f"Serializando objeto")
    return json.dumps(data, default=convert_sub_objects, indent=4)

def sanitize_html_for_pdf(html_string):
    if not isinstance(html_string, str):
        return None
    
    if len(html_string) > MAX_HTML_SIZE:
        log_error('HTML excede tamanho maximo')
        return None
    
    dangerous_patterns = [
        '<script', 'javascript:', 'onerror=', 'onload=', 'onclick=', 'onmouseover=',
        '<?php', '<%', 'eval(', '<iframe', '<object', '<embed', '<svg', '<style',
        'import ', 'exec(', 'system('
    ]
    
    html_lower = html_string.lower()
    for pattern in dangerous_patterns:
        if pattern in html_lower:
            log_error(f'Padrao perigoso detectado')
            return None
    
    return html_string

def format_sales_receipt(html_string: str, base_path: str) -> str | None:
    try:
        if not isinstance(html_string, str) or len(html_string) < 50:
            log_error("HTML invalido")
            return None
        
        sanitized_html = sanitize_html_for_pdf(html_string)
        if not sanitized_html:
            log_error("HTML falhou na sanitizacao")
            return None
        
        if not isinstance(base_path, str):
            log_error('Base path invalido')
            return None
        
        comprovante_dir = os.path.join(str(base_path), 'comprovante')
        
        if '..' in comprovante_dir or comprovante_dir.count('..') > 0:
            log_error('Path traversal detectado')
            return None
        
        if not os.path.exists(comprovante_dir):
            os.makedirs(comprovante_dir, mode=0o700)
        
        pdf_path = os.path.join(comprovante_dir, 'comprovante.pdf')
        
        if len(pdf_path) > 260:
            log_error('Caminho do PDF muito longo')
            return None

        pdf = FPDF(orientation='P', unit='mm', format=[80, 200])
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=5)
        pdf.set_font('helvetica', size=9)
        
        pdf.write_html(sanitized_html)
        pdf.output(pdf_path)
        
        if not os.path.exists(pdf_path):
            log_error(f"Arquivo PDF nao foi criado")
            return None
        
        file_size = os.path.getsize(pdf_path)
        if file_size > MAX_PDF_SIZE:
            os.remove(pdf_path)
            log_error(f"PDF excede tamanho maximo")
            return None
        
        os.chmod(pdf_path, 0o600)
        log_info(f"PDF salvo com sucesso")
        return pdf_path
        
    except Exception as e:
        log_error(f"Erro ao gerar PDF: {str(e)}")
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