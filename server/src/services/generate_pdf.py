import os
import barcode
import qrcode
from pathlib import Path
from barcode.writer import ImageWriter
from server.src.utils.logger import log_debug, log_error

MAX_FILENAME_LENGTH = 255
MAX_PATH_LENGTH = 1000
MAX_URL_LENGTH = 500

def sanitize_path(path_str):
    if not path_str or not isinstance(path_str, str):
        return None
    
    if len(path_str) > MAX_PATH_LENGTH:
        log_error('Path muito longo')
        return None
    
    path = Path(path_str)
    
    if '..' in path.parts:
        log_error('Path traversal detectado')
        return None
    
    try:
        real_path = path.resolve()
        if path.is_symlink():
            log_error('Symlink detectado')
            return None
    except (OSError, RuntimeError):
        log_error('Erro ao resolver path')
        return None
    
    return real_path

def validate_image_path(img_path):
    if not img_path or not isinstance(img_path, str):
        return False
    
    if len(img_path) > MAX_URL_LENGTH:
        log_error('Caminho de imagem muito longo')
        return False
    
    if not os.path.exists(img_path):
        log_error('Arquivo de imagem nao existe')
        return False
    
    if os.path.islink(img_path):
        log_error('Arquivo de imagem eh symlink')
        return False
    
    try:
        real_path = os.path.realpath(img_path)
        if not os.path.exists(real_path):
            log_error('Caminho resolvido de imagem nao existe')
            return False
    except (OSError, RuntimeError):
        log_error('Erro ao resolver caminho de imagem')
        return False
    
    return True

def generate_qrcode(base_path):
    try:
        sanitized_path = sanitize_path(base_path)
        if not sanitized_path:
            log_error('Base path invalido para QR code')
            return None
        
        url = "https://mg-sweets.web.app/"
        save_dir = os.path.join(str(sanitized_path), 'barcodes')
        
        if not os.path.exists(save_dir):
            os.makedirs(save_dir, mode=0o700)
        
        full_path = os.path.join(save_dir, 'qrcode.png')
        
        if os.path.exists(full_path) and os.path.islink(full_path):
            log_error('QR code path eh symlink')
            return None
        
        qrcode_img = qrcode.make(
            data=url,
            version=1,
            box_size=4,
            border=1
        )

        qrcode_img.save(full_path)
        os.chmod(full_path, 0o600)
        log_debug('QR code salvo')
        return full_path
    except Exception as e:
        log_error('Erro ao gerar QR code')
        return None

def generate_barcode(code, base_path):
    try:
        sanitized_path = sanitize_path(base_path)
        if not sanitized_path:
            log_error('Base path invalido para barcode')
            return None
        
        if not code or len(str(code)) < 3:
            log_error('Codigo do barcode muito curto')
            return None
            
        clean_code = ''.join(filter(str.isdigit, str(code)))
        if len(clean_code) < 3:
            clean_code = clean_code.zfill(12)
        
        if len(clean_code) > 18:
            log_error('Codigo do barcode muito longo')
            return None
        
        log_debug('Gerando barcode')
        
        code39 = barcode.get('code128', clean_code, writer=ImageWriter())
        
        save_dir = os.path.join(str(sanitized_path), 'barcodes')
        if not os.path.exists(save_dir):
            os.makedirs(save_dir, mode=0o700)
        
        file_path = os.path.join(save_dir, 'barcode')
        
        options = {
            'module_width': 0.3,
            'module_height': 10,
            'write_text': False,
            'quiet_zone': 2.5,
            'text_distance': 3,
            'font_size': 10
        }
        
        full_path = code39.save(file_path, options=options)
        
        if os.path.islink(full_path):
            log_error('Barcode path eh symlink')
            return None
        
        os.chmod(full_path, 0o600)
        log_debug('Barcode salvo')
        return full_path
        
    except Exception as e:
        log_error('Erro ao gerar barcode')
        return None

def generate_html(data, username: str, qrcode_path: str, barcode_path: str) -> str:
    items_rows = ""
    if hasattr(data, 'items') and data.items:
        for item in data.items:
            item_name = item.get('sweetName', 'Produto')
            item_qty = item.get('quantity', 0)
            item_unit_price = float(item.get('priceAtSale', 0))
            item_subtotal = float(item.get('subtotal', 0))
            item_discount = float(item.get('itemDiscount', 0))
            
            items_rows += f"""
                <tr>
                    <td align="left">{item_name}</td>
                    <td align="right">{item_qty} UN</td>
                    <td align="right">{item_unit_price:.2f}</td>
                    <td align="right">{item_subtotal:.2f}</td>
                </tr>
            """
            
            if item_discount > 0:
                items_rows += f"""
                    <tr>
                        <td colspan="3" align="right"><font size="8" color="green">Desconto item ({item_discount}%)</font></td>
                        <td align="right"><font size="8" color="green">-{item.get('discountedAmount', 0):.2f}</font></td>
                    </tr>
                """

    subtotal_value = float(getattr(data, 'subtotal', 0))
    item_discounts_total = float(getattr(data, 'itemDiscountsTotal', 0))
    global_discount_percent = float(getattr(data, 'globalDiscountPercent', 0))
    global_discount_amount = float(getattr(data, 'globalDiscountAmount', 0))
    total_amount = float(getattr(data, 'totalAmount', 0))

    discount_rows = ""
    if item_discounts_total > 0:
        discount_rows += f"""
            <tr>
                <td align="left"><font color="green">Desconto em itens</font></td>
                <td align="right"><font color="green">-{item_discounts_total:.2f}</font></td>
            </tr>
        """
    
    if global_discount_percent > 0:
        discount_rows += f"""
            <tr>
                <td align="left"><font color="green">Desconto global ({global_discount_percent}%)</font></td>
                <td align="right"><font color="green">-{global_discount_amount:.2f}</font></td>
            </tr>
        """

    barcode_img = ""
    if barcode_path:
        try:
            if os.path.exists(barcode_path):
                barcode_img = f'<img src="{barcode_path}" width="150"/>'
                log_debug(f"Barcode incluído: {barcode_path}")
            else:
                log_error(f"Barcode não encontrado: {barcode_path}")
        except Exception as e:
            log_error(f"Erro ao incluir barcode: {str(e)}")
    
    qrcode_img = ""
    if qrcode_path:
        try:
            if os.path.exists(qrcode_path):
                qrcode_img = f'<img src="{qrcode_path}" width="80"/>'
                log_debug(f"QR Code incluído: {qrcode_path}")
            else:
                log_error(f"QR Code não encontrado: {qrcode_path}")
        except Exception as e:
            log_error(f"Erro ao incluir QR Code: {str(e)}")

    username_display = str(username)[:50] if username else "Operador"

    return f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8" />
        <title>Comprovante</title>
    </head>
    <body>
        <table width="100%" cellspacing="0" cellpadding="1">
            <thead>
                <tr><th>Sweet Home</th></tr>
                <tr><th><font size="7">Operador: {username_display}</font></th></tr>
                <tr><th><font size="7">Cliente: {data.payer.get('nome', 'Cliente')}</font></th></tr>
                <tr><th><font size="8">ID {data.transaction_id}</font></th></tr>
                <tr><th>CUPOM FISCAL ELETRONICO</th></tr>
            </thead>
        </table>
        <hr>
        <table width="100%" cellspacing="0" cellpadding="1">
            <thead>
                <tr>
                    <th align="left"><font size="9">DESCRICAO</font></th>
                    <th align="right"><font size="9">QTD</font></th>
                    <th align="right"><font size="9">VL. UNIT.</font></th>
                    <th align="right"><font size="9">VL. ITEM</font></th>
                </tr>
            </thead>
            <tbody>
                {items_rows}
            </tbody>
        </table>
        <hr>
        <table width="100%" cellspacing="0" cellpadding="1">
            <tbody>
                <tr>
                    <td align="left">Subtotal</td>
                    <td align="right">{subtotal_value:.2f}</td>
                </tr>
                {discount_rows}
                <tr>
                    <td align="left">{data.payment_type.value}</td>
                    <td align="right">{total_amount:.2f}</td>
                </tr>
            </tbody>
        </table>
        <table width="100%" cellspacing="0" cellpadding="1">
            <thead>
                <tr>
                    <th>TOTAL R$: {total_amount:.2f}</th>
                    <th align="center">{data.timestamp}</th>
                </tr>
            </thead>
        </table>
        <hr>
        <p align="center"><b>CÓDIGO DE BARRAS</b></p>
        <p align="center">{barcode_img}</p>
        <p align="center"><b>CÓDIGO QR</b></p>
        <p align="center">{qrcode_img}</p>
    </body>
    </html>
    """

if __name__ == "__main__":
    import pathlib
    CURRENT_PATH = str(pathlib.Path().resolve())
    barcode_path = generate_barcode("1234567890", CURRENT_PATH)
    qr_path = generate_qrcode(CURRENT_PATH)
