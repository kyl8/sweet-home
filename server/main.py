import sys
import os
import logging

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from quart import Quart, request, jsonify
from quart_jwt_extended import JWTManager
from quart_cors import cors 

from routes.auth import auth
from routes.sales import sales
from services.key_service import validate_entry
from utils import crypto

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

api_key = 123

app = Quart(__name__)
app = cors(app, 
    allow_origin=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"]
)
        
@app.route("/", methods=['POST'])
async def validate_entry_route():
    """Health check and API key validation endpoint."""
    return await validate_entry()

@app.route('/', methods=['GET'])
async def hello_world():
    """Root endpoint for API verification."""
    return {'status': 'API is running'}, 200

keys = crypto.find_keys()
valid_keys = crypto.identify_valid_keys(keys)

if not valid_keys.get('private_key') or not valid_keys.get('public_key'):
    logging.error("RSA keys not properly initialized")
    raise Exception("RSA keys configuration failed")

app.config["JWT_ALGORITHM"] = "RS256"
app.config["JWT_PRIVATE_KEY"] = valid_keys['private_key']
app.config["JWT_PUBLIC_KEY"] = valid_keys['public_key']

jwt = JWTManager(app)

app.register_blueprint(auth, url_prefix='/api/auth')
app.register_blueprint(sales, url_prefix='/api/sales')

if __name__ == "__main__":
    app.run(debug=True, port=3001, host="0.0.0.0")
