import re
import datetime
import logging
from email_validator import validate_email, EmailNotValidError
import zoneinfo

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def timestamp() -> str:
    """Generate current timestamp in São Paulo timezone."""
    logging.info("Generating timestamp in São Paulo timezone")
    TIMESTAMP = datetime.datetime.now(zoneinfo.ZoneInfo("America/Sao_Paulo")).strftime("%Y-%m-%d %H:%M:%S")
    return TIMESTAMP

def validate_username(username: str) -> bool:
    """Validate username format (3-20 alphanumeric chars, starts with letter)."""
    if not username:
        logging.error("Username cannot be empty")
        return False
    
    logging.info(f"Validating username: {username}")
    if not re.match(r'^[a-zA-Z][a-zA-Z0-9_]{2,19}$', username):
        logging.error("Invalid username format")
        return False
    logging.info("Username is valid")
    return True
    
def is_email_valid(email: str) -> tuple[bool, Exception | None]:
    """Validate email address format."""
    if not email:
        logging.error("Email cannot be empty")
        return (False, Exception("Email cannot be empty"))
    
    logging.info(f"Validating email: {email}")
    try:
        valid = validate_email(email)
        logging.info(f"Email validated: {valid.email}")
        return (True, None)
    except EmailNotValidError as error:
        logging.error(f"Invalid email: {email}")
        return (False, error)
    
def validate_password(password: str) -> bool:
    """Validate password (minimum 8 chars with uppercase, lowercase, digit, special char)."""
    if not password:
        logging.error("Password cannot be empty")
        return False
    
    logging.info("Validating password")
    if len(password) < 8 or not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$', password):
        logging.error("Invalid password")
        return False
    logging.info("Password is valid")
    return True
