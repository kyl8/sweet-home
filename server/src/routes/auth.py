from quart import Blueprint, request, jsonify
from quart_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import os
from datetime import datetime, timedelta

from server.src.services import firebase_auth_service as auth_service
from server.src.services.register_service import validate_username, is_email_valid, validate_password, timestamp
from server.src.utils.logger import log_info, log_warn, log_error, log_debug

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST", "OPTIONS"])
async def register():
    data = await request.get_json()
    if not data:
        return jsonify({"msg": "Dados invalidos"}), 400
    
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')
    
    if not username or not validate_username(username):
        return jsonify({"msg": "Nome de usuario invalido"}), 400
    if not email or not is_email_valid(email)[0]:
        return jsonify({"msg": "Email invalido"}), 400
    if not password or not validate_password(password):
        return jsonify({"msg": "Senha invalida"}), 400
    if password != confirm_password:
        return jsonify({"msg": "Senhas nao conferem"}), 400
    
    return jsonify({"msg": "Usuario validado"}), 200

@auth_bp.route('/login', methods=["POST", "OPTIONS"])
async def login():
    try:
        data = await request.get_json()
        
        if not data:
            return jsonify({"msg": "Requisicao invalida"}), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({"msg": "Credenciais incompletas"}), 400
        
        if len(username) > 50 or len(password) > 256:
            return jsonify({"msg": "Credenciais invalidas"}), 400
        
        user = await auth_service.authenticate(username, password)
        
        if not user:
            return jsonify({"msg": "Credenciais invalidas"}), 401
        
        jwt_expires = timedelta(minutes=int(os.getenv('JWT_EXPIRES_MINUTES', '60')))
        access_token = create_access_token(
            identity={"id": user.id, "username": user.username},
            expires_delta=jwt_expires
        )
        
        log_info(f'Login bem-sucedido para usuario: {user.id}')
        
        return jsonify({
            "username": username,
            "access_token": access_token,
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        log_error(f'Erro no login: {str(e)}')
        return jsonify({"msg": "Erro interno do servidor"}), 500

@auth_bp.route('/dashboard', methods=["GET", "OPTIONS"])
@jwt_required
async def dashboard():
    try:
        current_user = get_jwt_identity()
        
        if not current_user or 'id' not in current_user:
            return jsonify({"msg": "Usuario nao autenticado"}), 401

        user = await auth_service.get_user_by_id(current_user['id'])
        
        if not user:
            return jsonify({"msg": "Usuario nao encontrado"}), 404

        log_info(f'Dashboard acessado pelo usuario: {current_user["id"]}')
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        log_error('Erro no dashboard')
        return jsonify({"msg": "Erro interno do servidor"}), 500

@auth_bp.route('/logout', methods=["POST", "OPTIONS"])
@jwt_required
async def logout():
    return jsonify({"msg": "Logout bem-sucedido"}), 200

@auth_bp.route('/refresh', methods=["POST", "OPTIONS"])
@jwt_required
async def refresh_token():
    try:
        current_user = get_jwt_identity()
        
        if not current_user or 'id' not in current_user:
            return jsonify({"msg": "Usuario nao autenticado"}), 401
        
        jwt_expires = timedelta(minutes=int(os.getenv('JWT_EXPIRES_MINUTES', '60')))
        new_token = create_access_token(
            identity=current_user,
            expires_delta=jwt_expires
        )
        
        log_info(f'Token renovado para usuario: {current_user["id"]}')
        return jsonify({"access_token": new_token}), 200
        
    except Exception as e:
        log_error('Erro ao renovar token')
        return jsonify({"msg": "Erro ao renovar token"}), 500