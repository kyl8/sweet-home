from dataclasses import dataclass, field
from typing import Optional

from werkzeug.security import generate_password_hash, check_password_hash

@dataclass
class User:
    id: int
    username: str
    email: Optional[str] = field(default=None, repr=False)
    password_hashed: str = field(default='', repr=False)
    
    def set_password(self, password: str):
        self.password_hashed = generate_password_hash(
            password, 
            method="scrypt", 
            salt_length=16
        )
    
    def check_password(self, password: str) -> bool:
        if not self.password_hashed:
            return False
        
        return check_password_hash(self.password_hashed, password)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email
        }