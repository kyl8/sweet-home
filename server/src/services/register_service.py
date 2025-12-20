import re
import datetime
from email_validator import validate_email, EmailNotValidError
import zoneinfo
from utils.logger import log_info, log_error

def timestamp() -> str:
    log_info("Gerando timestamp no fuso horário de São Paulo")
    return datetime.datetime.now(
        zoneinfo.ZoneInfo("America/Sao_Paulo")
    ).strftime("%Y-%m-%d %H:%M:%S")

def validate_username(username: str) -> bool:
    """Validar formato do nome de usuário (3-20 caracteres alfanuméricos, começa com letra)."""
    if not username:
        log_error("Nome de usuário não pode estar vazio")
        return False
    
    log_info(f"Validando nome de usuário: {username}")
    if not re.match(r'^[a-zA-Z][a-zA-Z0-9_]{2,19}$', username):
        log_error("Formato de nome de usuário inválido")
        return False
    log_info("Nome de usuário válido")
    return True
    
def is_email_valid(email: str) -> tuple[bool, Exception | None]:
    """Validar formato do endereço de email."""
    if not email:
        log_error("Email não pode estar vazio")
        return (False, Exception("Email não pode estar vazio"))
    
    log_info(f"Validando email: {email}")
    try:
        valid = validate_email(email)
        log_info(f"Email validado: {valid.email}")
        return (True, None)
    except EmailNotValidError as error:
        log_error(f"Invalid email: {email}")
        return (False, error)
    
def validate_password(password: str) -> bool:
    """Validar senha (mínimo 8 caracteres com maiúscula, minúscula, dígito, caractere especial)."""
    if not password:
        log_error("Senha não pode estar vazia")
        return False
    
    log_info("Validando senha")
    if len(password) < 8 or not re.match(
        r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$', 
        password
    ):
        log_error("Senha inválida: deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, dígito e caractere especial")
        return False
    log_info("Senha válida")
    return True
