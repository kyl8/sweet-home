from utils.logger import log_debug, log_error

def read_bytes(path: str) -> bytes | None:
    pdf_content = None 
    try:
        with open(path, 'rb') as pdf:
            pdf_content = pdf.read()
                  
        if pdf_content:
            bytes_len = len(pdf_content)
            log_debug(f"PDF gerado com {bytes_len} bytes. Enviando arquivo...")
        return pdf_content
    except FileNotFoundError:
        log_error(f'Arquivo não encontrado em {path}')
        return None


def generate_numeric_id_from_string(input_string: str, uuid_str: str = "", transaction_id: str = "") -> str:
    """Gerar ID numérico de 13 dígitos a partir de valores de string combinados."""
    if not input_string:
        input_string = ""
    
    combined = f"{input_string}{uuid_str}{transaction_id}"
    
    total_sum = sum(ord(char) for char in combined if char.isalnum())
    limited_sum = total_sum % 10**13
    numeric_id_str = str(limited_sum).zfill(13)
    
    return numeric_id_str
