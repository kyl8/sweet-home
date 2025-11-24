import logging
import os

import barcode
import qrcode
from barcode.writer import ImageWriter

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def generate_qrcode(path):
    """Generate QR code image and save to file."""
    try:
        url = "https://mg-sweets.web.app/"
        save_dir = os.path.join(path, 'barcodes')
        os.makedirs(save_dir, exist_ok=True)
        full_path = os.path.join(save_dir, 'qrcode.png')
        qrcode_img = qrcode.make(
            data=url,
            version=1,
            box_size=7,
            border=5
        )

        with open(full_path, "wb") as f:
            logging.debug(f"Generating QR code for URL: {url}")
            qrcode_img.save(f)

        logging.debug(f"QR code saved at: {full_path}")
        return full_path
    except Exception as e:
        logging.error(f"QR code generation error: {e}")
        return None
    
def generate_barcode(CODE, path):
    """Generate barcode image and save to file."""
    barcode_options = {
        "module_width": 0.130,
        "module_height": 5,
        "write_text": False,
        "text_distance": 1,
        "quiet_zone": 1
    }
    try:
        logging.debug(f"Generating barcode for code: {CODE}")
        code39 = barcode.get('code39', CODE, writer=ImageWriter())

        save_dir = os.path.join(path, 'barcodes')
        os.makedirs(save_dir, exist_ok=True)

        file_path = os.path.join(save_dir, 'barcode')
        full_path = code39.save(file_path, options=barcode_options)

        logging.debug(f"Barcode saved at: {full_path}")
        return full_path
    except Exception as e:
        logging.error(f"Barcode generation error: {e}")
        return None

def generate_html(data, qrcode_func, barcode_func):
    """Generate HTML receipt template with transaction data."""
    qr_code = qrcode_func
    barcode_img = barcode_func
    html_code = f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8" />
        <title>Comprovante</title>
    </head>
    <body>

        <table width="80%" cellspacing="0" cellpadding="2">
            <thead>
                    <tr>
                        <th>{data.receiver['nome']}</th>
                    </tr>
                    <tr>
                        <th>ID {data.transaction_id}</th>
                    </tr>
                    <tr>
                        <th>CUPOM FISCAL ELETRÔNICO</th>
                    </tr>
                </thead>
        </table>
            <hr>

            
            <table width="80%" cellspacing="0" cellpadding="2">
                <thead>
                    <tr>
                        <th align="left">DESCRIÇÃO</th>
                        <th align="right">QTD</th>
                        <th align="right">VL. UNIT.</th>
                        <th align="right">VL. ITEM</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td align="left">{data.description}</td>
                        <td align="right">{data.qtd} UN</td>
                        <td align="right">8,00</td>
                        <td align="right">8,00</td>
                    </tr>
                </tbody>
            </table>
            <hr>

            
            <table width="80%" cellspacing="0" cellpadding="1">
                <tbody>
                    <tr>
                        <td align="left">Total bruto</td>
                        <td align="right">8,00</td>
                    </tr>
                    <tr>
                        <td align="left">{data.payment_type.value}</td>
                        <td align="right">8,00</td>
                    </tr>
                    <tr>
                        <td align="left">Troco</td>
                        <td align="right">0,00</td>
                    </tr>
                </tbody>
            </table>
            
            <table width="80%" cellspacing="0" cellpadding="2">
                <thead>
                    <tr>
                        <th>TOTAL R$: 8,00</th>
                        <th align="center">{data.timestamp}</th>
                    </tr>
                    <tr>
                        <th>Pagador:</th>
                        <th align="center">{data.payer['nome']}</th>
                    </tr>
                </thead>
            </table>
            <hr>
            <p align="center">{data.barcode_str}</p>
            <p align="center"><img src="{barcode_img}"/></p>
            <p align="center"><img src="{qr_code}"/></p>
            <p><font size="1">Dados comprobatórios sem autenticação SAT</font></p>

    </body>
    </html>
    """
    return html_code

if __name__ == "__main__":
    import pathlib
    CURRENT_PATH = str(pathlib.Path().resolve())
    barcode_path = generate_barcode("1234567890", CURRENT_PATH)
    qr_path = generate_qrcode(CURRENT_PATH)
