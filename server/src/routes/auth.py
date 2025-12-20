from quart import Blueprint, request, jsonify
from quart_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import os
from datetime import datetime, timedelta
import secrets

from services import firebase_auth_service as auth_service
from services.register_service import validate_username, is_email_valid, validate_password, timestamp
from utils.logger import log_info, log_warn, log_error, log_debug

auth = Blueprint('auth', __name__)

REQUEST_TIMEOUT = 30
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION = 900

login_attempts = {}
token_blacklist = set()
cleanup_interval = 0

@auth.post('/login')
async def login():
    global cleanup_interval
    cleanup_interval += 1
    
    if cleanup_interval > 100:
        now = datetime.now()
        expired_ips = [ip for ip, (_, lockout_time) in login_attempts.items() 
                      if lockout_time and now > lockout_time]
        for ip in expired_ips:
            del login_attempts[ip]
        cleanup_interval = 0
    
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
        
        client_ip = request.remote_addr
        now = datetime.now()
        
        if client_ip in login_attempts:
            attempts, lockout_time = login_attempts[client_ip]
            if lockout_time and now < lockout_time:
                remaining = int((lockout_time - now).total_seconds())
                log_warn('Tentativa apos lockout', {'ip': client_ip})
                return jsonify({"msg": f"Muitas tentativas. Tente novamente em {remaining}s"}), 429
            elif lockout_time and now >= lockout_time:
                del login_attempts[client_ip]
        
        user = await auth_service.authenticate(username, password)
        
        if not user:
            if client_ip in login_attempts:
                attempts, _ = login_attempts[client_ip]
                attempts += 1
            else:
                attempts = 1
            
            if attempts >= MAX_LOGIN_ATTEMPTS:
                lockout_until = now + timedelta(seconds=LOCKOUT_DURATION)
                login_attempts[client_ip] = (attempts, lockout_until)
                log_warn('Lockout ativado', {'ip': client_ip})
                return jsonify({"msg": "Muitas tentativas. Tente novamente em 15 minutos"}), 429
            else:
                login_attempts[client_ip] = (attempts, None)
            
            return jsonify({"msg": "Credenciais invalidas"}), 401
        
        if client_ip in login_attempts:
            del login_attempts[client_ip]
        
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

@auth.post('/register')
async def register():
    try:
        data = await request.get_json()
        
        if not data:
            return jsonify({"msg": "Requisicao invalida"}), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '')
        confirm_password = None
        for key in ('confirm_password', 'confirmPassword', 'confirm'):
            if key in data:
                confirm_password = data.get(key)
                break

        if confirm_password is None:
            confirm_password = ''
        else:
            confirm_password = str(confirm_password)
        email = data.get('email', '').strip()

        log_debug('Register request keys', {'keys': list(data.keys())})
        log_debug('Password fields presence', {
            'has_password': 'password' in data,
            'has_confirm': any(k in data for k in ('confirm_password', 'confirmPassword', 'confirm'))
        })

        username_valid = validate_username(username)
        email_valid, email_error = is_email_valid(email)
        password_valid = validate_password(password)

        if username_valid and email_valid and password_valid and password == confirm_password:
            import time
            user_id = int(time.time() * 1000) % 1000000
            
            try:
                success = await auth_service.register_user_async(user_id, username, email, password)
            except Exception as e:
                log_error(f'Erro ao tentar registrar usuario async: {str(e)}')
                success = False
            
            if success:
                log_info(f'Registro bem-sucedido para usuario: {username}')
                return jsonify({
                    "msg": "Registro realizado com sucesso", 
                    "valid": True, 
                    "timestamp": timestamp()
                }), 200
            else:
                last_err = None
                try:
                    last_err = auth_service.get_last_error()
                except Exception:
                    last_err = None
                
                if last_err:
                    if 'Usuário já existe' in last_err or 'duplicado' in last_err or 'already exists' in last_err:
                        return jsonify({"msg": last_err, "valid": False}), 409
                    if 'username inválido' in last_err or 'email inválido' in last_err or 'password inválido' in last_err:
                        return jsonify({"msg": last_err, "valid": False}), 400
                    if 'Event loop already running' in last_err:
                        log_warn(last_err)
                        return jsonify({"msg": "Servidor em modo async: registro falhou. Tente novamente." , "valid": False}), 500
                    log_error(f'Erro no registro: {last_err}')
                    return jsonify({"msg": "Erro interno do servidor", "valid": False}), 500
                
                return jsonify({
                    "msg": "Usuario ja existe",
                    "valid": False
                }), 409
        
        errors = []
        if not username:
            errors.append({"username_error": "Username e obrigatorio"})
        if not email:
            errors.append({"email_error": "Email e obrigatorio"})
        elif not email_valid:
            errors.append({"email_error": "Email invalido"})
        if not password:
            errors.append({"password_error": "Password e obrigatorio"})
        if not confirm_password:
            errors.append({"confirm_password_error": "Confirmacao de senha obrigatoria"})
        if password and confirm_password and password != confirm_password:
            errors.append({"password_error": "Senhas nao coincidem"})
        if password and not password_valid:
            errors.append({"password_error": "Senha nao atende aos criterios"})
        if not username_valid:
            errors.append({"username_error": "Username invalido"})

        log_warn('Falha no registro', {'errors': errors, 'errors_count': len(errors)})
        log_debug('Registro validation context', {'confirm_present': bool(confirm_password), 'passwords_match': password == confirm_password})
        return jsonify({"valid": False, "errors": errors}), 400
        
    except Exception as e:
        log_error(f'Erro no registro: {str(e)}', exc_info=True)
        return jsonify({"msg": "Erro interno do servidor"}), 500

@auth.get('/dashboard')
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

@auth.post('/logout')
@jwt_required
async def logout():
    try:
        current_user = get_jwt_identity()
        
        token_id = f"{current_user.get('id')}_{datetime.now().isoformat()}"
        token_blacklist.add(token_id)
        
        log_info(f'Logout realizado para usuario: {current_user.get("id")}')
        return jsonify({"msg": "Logout bem-sucedido"}), 200
    except Exception as e:
        log_error('Erro no logout')
        return jsonify({"msg": "Erro no logout"}), 500

@auth.post('/refresh')
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