import logging
from dataclasses import dataclass, field
from typing import Optional

from werkzeug.security import generate_password_hash, check_password_hash

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

@dataclass
class User:
    id: int
    username: str
    email: Optional[str] = field(default=None, repr=False)
    password_hashed: str = field(default='', repr=False)
    
    def set_password(self, password: str):
        logging.info(f"Definindo senha para o usuário: {self.username}")
        self.password_hashed = generate_password_hash(
            password, 
            method="scrypt", 
            salt_length=16
        )
        logging.debug(f"Hash da senha definido para o usuário: {self.username}")
    
    def check_password(self, password: str) -> bool:
        logging.info(f"Verificando senha para o usuário: {self.username}")
        
        if not self.password_hashed:
            logging.warning(f"Nenhum hash de senha encontrado para o usuário: {self.username}")
            return False
        
        try:
            result = check_password_hash(self.password_hashed, password)
            logging.debug(f"Hash: {self.password_hashed[:50]}...")
            logging.debug(f"Comprimento da senha: {len(password)}")
            logging.debug(f"Resultado da verificação da senha para {self.username}: {result}")
            return result
        except Exception as e:
            logging.error(f"Erro durante a verificação da senha para o usuário {self.username}: {str(e)}")
            return False

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email
        }