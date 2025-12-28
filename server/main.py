from dotenv import load_dotenv
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from quart import Quart, request, jsonify
from quart_cors import cors
from server.src.utils.logging_config import setup_logging
from server.src.routes.auth import auth_bp
from server.src.routes.keys import keys
from server.src.routes.sales import sales
from quart_jwt_extended import JWTManager
from server.src.utils import crypto
from server.src.utils.logger import log_info, log_error

load_dotenv()

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 3001))
JWT_PRIVATE_KEY_PATH = os.getenv("JWT_PRIVATE_KEY_PATH", "src/utils/.secret/private_key.pem")

app = Quart(__name__)
app = cors(
    app,
    allow_origin="http://localhost:3000",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    expose_headers=["Content-Type"],
    max_age=3600
)

setup_logging()

@app.before_request
async def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept")
        response.headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 200

@app.after_request
async def set_security_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, Accept'
    
    
    response.headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'no-referrer-when-downgrade'
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=()'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

@app.route('/', methods=['GET'])
async def hello_world():
    return {'status': 'API running'}, 200

# Configuração JWT
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


app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(keys, url_prefix='/api/keys')
app.register_blueprint(sales, url_prefix='/api/sales')

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