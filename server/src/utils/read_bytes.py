from utils.logger import log_debug, log_error

def read_bytes(path: str) -> bytes | None:
    try:
        with open(path, 'rb') as pdf:
            pdf_content = pdf.read()
                  
        if pdf_content:
            bytes_len = len(pdf_content)
            log_debug(f"PDF gerado com {bytes_len} bytes")
        return pdf_content
    except FileNotFoundError:
        log_error('Arquivo não encontrado')
        return None
    except Exception as e:
        log_error('Erro ao ler o arquivo')
        return None