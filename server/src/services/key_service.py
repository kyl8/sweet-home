import logging
import secrets
import string
import hashlib
import datetime
from functools import wraps

from quart import request, jsonify

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def protect_route(function):
    """Decorator to protect routes with API key validation."""
    @wraps(function)
    async def wrapper(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            logging.warning("Missing API key")
            return {"error": "API key is missing"}, 401
        
        if api_key != str(123):
            logging.warning("Invalid API key")
            return {"error": "Invalid API key"}, 401
        
        logging.info("API key validated successfully")
        return await function(*args, **kwargs)
    
    return wrapper

api_key = 3

async def validate_entry():
    """Validate entry with API key from request body."""
    try:
        data = await request.get_json()
        if data and 'api_key' in data:
            data_key = data['api_key']
            if int(api_key) == int(data_key):
                return jsonify({"status": "Authorized", "valid": True}), 200
            else:
                return jsonify({"status": "Unauthorized", "valid": False}), 401
        else:
            return jsonify({"error": "Missing api_key field"}), 400
    except Exception as e:
        return jsonify({"error": "Invalid request"}), 400
    
def generate_key(t=32):
    """Generate random API key of specified length."""
    chars = string.ascii_letters + string.digits
    key = ''.join(secrets.choice(chars) for _ in range(t))
    logging.info(f"Generated key: {key}")
    return f"LUNAR_{key}"

def key_to_hash(key):
    """Convert API key to SHA256 hash."""
    return hashlib.sha256(key.encode()).hexdigest()

def generate_expiration_time(minutes=60):
    """Generate expiration time datetime object."""
    expiration_time = datetime.datetime.now() + datetime.timedelta(minutes=minutes)
    logging.info(f"Expiration time generated: {expiration_time}")
    return expiration_time

keys = {}

def validate_key(key):
    """Validate if key exists and has not expired."""
    if key in keys:
        expiration_time = keys[key]
        if datetime.datetime.now() < expiration_time:
            logging.info(f"Key {key} is valid and not expired.")
            return True
        else:
            logging.warning(f"Key {key} has expired.")
            return False
    else:
        logging.warning(f"Key {key} not found.")
        return False
        
def expires_in(key):
    """Get remaining time until key expiration."""
    if key in keys:
        expiration_time = keys[key]
        remaining_time = expiration_time - datetime.datetime.now()
        logging.info(f"Key {key} expires in {remaining_time} hours.")
        return remaining_time
    else:
        logging.warning(f"Key {key} not found.")
        return None
     
def save_key_to_db(key):
    """Save API key with expiration time to database."""
    if key in keys:
        logging.warning(f"Key {key} already exists in database.")
        return False
    else:
        keys[key] = generate_expiration_time()
        logging.info(f"Key {key} saved to database.")
        print(keys)
        return True
