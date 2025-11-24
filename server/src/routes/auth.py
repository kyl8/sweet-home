from quart import Blueprint, request, jsonify
from quart_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from services import auth_service
from models.user_model import User
from services.register_service import validate_username, is_email_valid, validate_password, timestamp

auth = Blueprint('auth', __name__)

@auth.post('/login')
async def login():
    """Authenticate user and return JWT token."""
    data = await request.get_json()
    if not data:
        return jsonify({"msg": "Request body cannot be empty"}), 400
    
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({"msg": "Username and password are required."}), 400
    
    user = await auth_service.authenticate(username, password)
    if not user:
        return jsonify({"msg": "Invalid username or password."}), 401
    
    access_token = create_access_token(identity={"id": user.id, "username": user.username})
    return jsonify({
        "username": username,
        "access_token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }), 200

@auth.post('/register')
async def register():
    """Register new user with validation."""
    data = await request.get_json()
    if not data:
        return jsonify({"msg": "Request body cannot be empty"}), 400
    
    username = data.get('username')
    password = data.get('password')
    confirm_password = data.get('confirm_password')
    email = data.get('email')

    username_valid = validate_username(username)
    email_valid, error_message = is_email_valid(email)
    password_valid = validate_password(password)

    if username_valid and email_valid and password_valid and password == confirm_password:
        return jsonify({"msg": "Valid data.", "valid": True, "timestamp": timestamp()}), 200
    
    errors = []
    if not email_valid:
        errors.append({"email_error": [str(error_message)] if error_message else "Invalid email."})
    if not username or not password or not email or not confirm_password:
        errors.append({"field_error": "All fields are required."})
    if password != confirm_password:
        errors.append({"password_error": "Passwords do not match."})
    if not password_valid:
        errors.append({"password_error": "Invalid password."})
    if not username_valid:
        errors.append({"username_error": "Invalid username."})
    
    return jsonify({"valid": False, "errors": errors}), 400

@auth.get('/dashboard')
@jwt_required
async def dashboard():
    """Get authenticated user dashboard data."""
    current_user = get_jwt_identity()
    if not current_user or 'id' not in current_user:
        return jsonify({"msg": "User not authenticated or invalid token."}), 401

    user = await auth_service.get_user_by_id(current_user['id'])

    if not user:
        return jsonify({"msg": "User not found."}), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email
    }), 200