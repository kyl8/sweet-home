import logging
from dataclasses import dataclass, field
from typing import Optional

from werkzeug.security import generate_password_hash, check_password_hash

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

@dataclass
class User:
    """User model for authentication and profile management."""
    id: int
    username: str
    email: Optional[str] = field(default=None, repr=False)
    password_hashed: str = field(init=False, repr=False)
    
    def set_password(self, password: str):
        """Hash and set user password using scrypt algorithm."""
        logging.info(f"Setting password for user: {self.username}")
        self.password_hashed = generate_password_hash(password, method="scrypt", salt_length=16)
    
    def check_password(self, password: str) -> bool:
        """Verify if provided password matches the stored hash."""
        logging.info(f"Verifying password for user: {self.username}")
        return check_password_hash(self.password_hashed, password)