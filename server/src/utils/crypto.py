import os
from typing import Dict, List

from cryptography.hazmat.primitives import serialization

current_dir = os.path.dirname(os.path.abspath(__file__))

def find_keys() -> List[str]:
    keys = []
    secret_path = os.path.join(current_dir, '.secret')
    
    if not os.path.exists(secret_path):
        return keys
        
    for root, __, files in os.walk(secret_path):
        for file in files:
            if file.endswith('.pem') or file.endswith('.key'):
                keys.append(os.path.join(root, file))
    return keys

def identify_valid_keys(key_array: List[str]) -> Dict[str, object]:
    valid_key_paths = {}
    
    for key_path in key_array:
        try:
            with open(key_path, 'rb') as key_file:
                key = serialization.load_pem_private_key(
                    key_file.read(),
                    password=None
                )
            valid_key_paths["private_key"] = key
        except ValueError:
            try:
                with open(key_path, 'rb') as key_file:
                    key = serialization.load_pem_public_key(key_file.read())
                valid_key_paths["public_key"] = key
            except Exception:
                continue
        except (FileNotFoundError, TypeError):
            print(f"Erro ao abrir ou ler a chave: {key_path}")
            continue

    return valid_key_paths

