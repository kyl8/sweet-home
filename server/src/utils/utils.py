import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def read_bytes(path: str) -> bytes | None:
    """Read binary file content from path."""
    pdf_content = None 
    try:
        with open(path, 'rb') as pdf:
            pdf_content = pdf.read()
                  
        if pdf_content:
            bytes_len = len(pdf_content)
            logging.debug(f"PDF generated with {bytes_len} bytes. Sending file...")
        return pdf_content
    except FileNotFoundError:
        logging.error(f'File not found at {path}')
        return None


def generate_numeric_id_from_string(input_string: str) -> str:
    """Generate 13-digit numeric ID from string using ordinal values."""
    if not input_string:
        return "0".zfill(13)

    total_sum = sum(ord(char) for char in input_string)
    limited_sum = total_sum % 10**13
    numeric_id_str = str(limited_sum).zfill(13)
    
    return numeric_id_str
