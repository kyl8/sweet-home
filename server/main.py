import sys
import os
import ssl

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from quart import Quart, jsonify
from quart_jwt_extended import JWTManager
from quart_cors import cors 
from functools import wraps

from routes.auth import auth
from routes.sales import sales
from routes.keys import keys
from utils import crypto
from utils.logger import log_info, log_error

app = Quart(__name__)
allowed_origins_str = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000,http://localhost:3001')
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(',') if origin.strip()]

if not allowed_origins:
    allowed_origins = ['http://localhost:5173', 'http://localhost:3000']

log_info(f"CORS allowed origins: {allowed_origins}")

app = cors(
    app,
    allow_origin=allowed_origins,
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allow_headers=['Content-Type', 'Authorization'],
    max_age=3600,
    expose_headers=['Content-Type', 'Authorization']
)

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

@app.after_request
async def set_security_headers(response):
    response.headers['Referrer-Policy'] = 'no-referrer-when-downgrade'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

@app.route('/', methods=['GET'])
async def hello_world():
    return {'status': 'API running'}, 200

pem_keys = crypto.find_keys()
valid_keys = crypto.identify_valid_keys(pem_keys)

if not valid_keys.get('private_key') or not valid_keys.get('public_key'):
    log_error("Chaves RSA nao inicializadas corretamente")
    raise Exception("Configuracao de chaves RSA falhou")

app.config["JWT_ALGORITHM"] = "RS256"
app.config["JWT_PRIVATE_KEY"] = valid_keys['private_key']
app.config["JWT_PUBLIC_KEY"] = valid_keys['public_key']
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = int(os.getenv('JWT_EXPIRES_MINUTES', '60')) * 60

jwt = JWTManager(app)

app.register_blueprint(auth, url_prefix='/api/auth')
app.register_blueprint(sales, url_prefix='/api/sales')
app.register_blueprint(keys, url_prefix='/api/keys')

@app.before_serving
async def startup():
    log_info("Servidor iniciando")

@app.after_serving
async def shutdown():
    log_info("Servidor encerrando")

if __name__ == "__main__":
    debug_mode = os.getenv('DEBUG', 'False').lower() == 'true'
    port = int(os.getenv('PORT', '3001'))
    host = os.getenv('HOST', '0.0.0.0')
    
    log_info(f"Iniciando servidor em {host}:{port}")
    
    app.run(debug=debug_mode, port=port, host=host)
