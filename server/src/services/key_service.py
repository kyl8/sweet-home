import logging
import secrets
import string
import hashlib
import datetime
import os
from functools import wraps

from quart import request, jsonify
from utils.logger import log_info, log_warn, log_error

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

API_KEY_LENGTH = 32
API_KEY_PREFIX = "LUNAR_"
MAX_API_KEY_LENGTH = 100
API_KEYS_COLLECTION = 'api_keys'  

api_keys_db = {}

try:
    from services.firebase_auth_service import firebase_db
    from firebase_admin import firestore as _firestore
except Exception:
    firebase_db = None
    _firestore = None

def protect_route(function):
    @wraps(function)
    async def wrapper(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key or not isinstance(api_key, str):
            logging.warning("API key ausente ou invalida")
            return {"error": "API key ausente"}, 401
        
        if len(api_key) > MAX_API_KEY_LENGTH:
            logging.warning("API key muito longa")
            return {"error": "API key invalida"}, 401
        
        if not validate_key(api_key):
            logging.warning("API key invalida ou expirada")
            return {"error": "API key invalida ou expirada"}, 401
        
        logging.info("API key validada com sucesso")
        return await function(*args, **kwargs)
    
    return wrapper

def generate_key(length=API_KEY_LENGTH):
    if not isinstance(length, int) or length < 16 or length > 64:
        length = API_KEY_LENGTH
    chars = string.ascii_letters + string.digits
    random_part = ''.join(secrets.choice(chars) for _ in range(length))
    key = f"{API_KEY_PREFIX}{random_part}"
    logging.info(f"Chave API gerada: {key[:10]}...")
    return key

def key_to_hash(key):
    if not isinstance(key, str):
        return None
    return hashlib.sha256(key.encode()).hexdigest()

def generate_expiration_time(minutes=60):
    if not isinstance(minutes, int) or minutes <= 0 or minutes > 525600:
        minutes = 60
    expiration_time = datetime.datetime.now() + datetime.timedelta(minutes=minutes)
    logging.info(f"Tempo de expiracao gerado: {expiration_time}")
    return expiration_time

def key_hash_and_prefix_info(key: str) -> dict:
    return {"prefix": key[:8] + "...", "hash": key_to_hash(key) if isinstance(key, str) else None, "key": key}

def save_key_to_db(key, minutes=60, owner: str | None = None):
    if not isinstance(key, str):
        logging.warning(f"Chave invalida")
        return False
    
    expiration_time = generate_expiration_time(minutes)
    key_info = key_hash_and_prefix_info(key)
    key_hash = key_info['hash']

    if firebase_db and _firestore:
        try:
            doc_ref = firebase_db.collection(API_KEYS_COLLECTION).document(key_hash)
            doc_ref.set({
                "owner": owner or None,
                "created_at": _firestore.SERVER_TIMESTAMP,
                "expires_at": expiration_time.isoformat(),
                "active": True,
                "key_info": key_info
            })
            logging.info(f"Chave salva no Firestore: {key[:8]}...")
            return True
        except Exception as e:
            logging.error(f"Erro ao salvar chave no Firestore: {str(e)}")
    if key_hash in api_keys_db:
        logging.warning(f"Chave ja existe no banco de dados")
        return False
    api_keys_db[key_hash] = expiration_time
    logging.info(f"Chave salva em memoria: {key[:8]}...")
    return True

def list_keys_from_db(owner: str | None = None):
    results = []
    if firebase_db:
        try:
            collection = firebase_db.collection(API_KEYS_COLLECTION)
            if owner:
                docs = collection.where('owner', '==', owner).stream()
            else:
                docs = collection.stream()
            for doc in docs:
                d = doc.to_dict()
                results.append({
                    "key_info": {k: v for k, v in d["key_info"].items() if k != "key"},
                    "owner": d.get('owner'),
                    "expires_at": d.get('expires_at'),
                    "active": d.get('active'),
                    "created_at": d.get('created_at')
                })
            return results
        except Exception as e:
            logging.error(f"Erro ao listar chaves no Firestore: {str(e)}")
    for h, exp in api_keys_db.items():
        results.append({"hash": h, "owner": None, "expires_at": exp.isoformat(), "active": True, "created_at": None})
    return results

def get_key_info(key: str):
    key_hash = key_to_hash(key) 
    if firebase_db:
        try:
            doc = firebase_db.collection(API_KEYS_COLLECTION).document(key_hash).get()
            if doc.exists:
                d = doc.to_dict()
                return {
                    "key_info": d.get('key_info', {}),
                    "owner": d.get('owner'),
                    "expires_at": d.get('expires_at'),
                    "active": d.get('active'),
                    "created_at": d.get('created_at')
                }
        except Exception as e:
            logging.error(f"Erro ao obter info de chave no Firestore: {str(e)}")
    exp = api_keys_db.get(key_hash)
    if exp:
        return {"hash": key_hash, "owner": None, "expires_at": exp.isoformat(), "active": True, "created_at": None}
    return None

def revoke_key(api_key_or_hash: str) -> bool:
    if not isinstance(api_key_or_hash, str):
        return False
    key_hash = api_key_or_hash if len(api_key_or_hash) == 64 and all(c in string.hexdigits for c in api_key_or_hash) else key_to_hash(api_key_or_hash)
    if firebase_db and _firestore:
        try:
            doc_ref = firebase_db.collection(API_KEYS_COLLECTION).document(key_hash)
            doc = doc_ref.get()
            if not doc.exists:
                logging.warning("Chave nao encontrada para revogacao")
                return False
            doc_ref.update({"active": False, "revoked_at": _firestore.SERVER_TIMESTAMP})
            logging.info(f"Chave revogada: {key_hash[:12]}...")
            return True
        except Exception as e:
            logging.error(f"Erro ao revogar chave no Firestore: {str(e)}")
            return False
    if key_hash in api_keys_db:
        del api_keys_db[key_hash]
        logging.info(f"Chave removida da memoria: {key_hash[:12]}...")
        return True
    logging.warning("Chave nao encontrada")
    return False

def validate_key(key):
    if not isinstance(key, str):
        logging.warning("Chave invalida")
        return False

    key_hash = key_to_hash(key)

    if firebase_db:
        try:
            doc = firebase_db.collection(API_KEYS_COLLECTION).document(key_hash).get()
            if not doc.exists:
                logging.warning("Chave nao encontrada")
                return False
            data = doc.to_dict()
            if not data.get('active', True):
                logging.warning("Chave revogada/inativa")
                return False
            expires_at = data.get('expires_at')
            if expires_at:
                try:
                    exp_dt = datetime.datetime.fromisoformat(expires_at)
                    if datetime.datetime.now() < exp_dt:
                        logging.info("Chave valida e nao expirada (Firestore)")
                        return True
                    else:
                        logging.warning("Chave expirada (Firestore)")
                        return False
                except Exception:
                    logging.warning("Formato de expiracao desconhecido")
                    return False
            logging.info("Chave valida (Firestore)")
            return True
        except Exception as e:
            logging.error(f"Erro ao validar chave no Firestore: {str(e)}")
            return False
    if key_hash not in api_keys_db:
        logging.warning(f"Chave nao encontrada")
        return False
    expiration_time = api_keys_db[key_hash]
    if datetime.datetime.now() < expiration_time:
        logging.info("Chave valida e nao expirada (memoria)")
        return True
    else:
        logging.warning("Chave expirada (memoria)")
        del api_keys_db[key_hash]
        return False

def expires_in(key):
    info = get_key_info(key)
    if not info or not info.get('expires_at'):
        return None
    try:
        exp_dt = datetime.datetime.fromisoformat(info['expires_at'])
        return exp_dt - datetime.datetime.now()
    except Exception:
        return None

async def validate_entry():
    try:
        data = await request.get_json()
        if not data or 'api_key' not in data:
            return jsonify({"error": "Campo api_key ausente"}), 400
        
        api_key = data.get('api_key')
        if not isinstance(api_key, str) or len(api_key) > MAX_API_KEY_LENGTH:
            return jsonify({"error": "API key invalida"}), 400
        
        if validate_key(api_key):
            return jsonify({"status": "Autorizado", "valid": True}), 200
        else:
            return jsonify({"status": "Nao autorizado", "valid": False}), 401
    except Exception as e:
        logging.error(f"Erro na validacao: {str(e)}")
        return jsonify({"error": "Requisicao invalida"}), 400
