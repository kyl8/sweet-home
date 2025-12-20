from quart import Blueprint, request, jsonify
from quart_jwt_extended import jwt_required, get_jwt_identity
from typing import Optional

from services import key_service
from utils.logger import log_info, log_warn, log_error, log_debug

keys = Blueprint('keys', __name__)

@keys.post('/')
@jwt_required
async def create_key():
    try:
        data = await request.get_json()
        owner = data.get('owner') if isinstance(data, dict) else None
        minutes = int(data.get('minutes', 60)) if isinstance(data, dict) and data.get('minutes') else 60
        new_key = key_service.generate_key()
        saved = key_service.save_key_to_db(new_key, minutes=minutes, owner=owner)
        if not saved:
            log_error("Falha ao salvar chave")
            return jsonify({"msg": "Erro ao criar chave"}), 500

        log_info(f"Chave criada para owner={owner}")
        return jsonify({
            "api_key": new_key,
            "expires_in_minutes": minutes,
            "owner": owner
        }), 201
    except Exception as e:
        log_error(f"Erro ao criar chave: {str(e)}")
        return jsonify({"msg": "Erro interno do servidor"}), 500

@keys.get('/')
@jwt_required
async def list_keys():
    try:
        owner = request.args.get('owner')
        entries = key_service.list_keys_from_db(owner=owner)
        return jsonify({"keys": entries}), 200
    except Exception as e:
        log_error(f"Erro ao listar chaves: {str(e)}")
        return jsonify({"msg": "Erro interno do servidor"}), 500

@keys.post('/validate')
async def validate_key():
    try:
        data = await request.get_json()
        api_key = data.get('api_key') if isinstance(data, dict) else None
        if not api_key or not isinstance(api_key, str):
            return jsonify({"msg": "api_key ausente ou invalida"}), 400
        valid = key_service.validate_key(api_key)
        info = key_service.get_key_info(api_key) or {}
        return jsonify({"valid": valid, "info": info}), (200 if valid else 401)
    except Exception as e:
        log_error(f"Erro ao validar chave: {str(e)}")
        return jsonify({"msg": "Erro interno do servidor"}), 500

@keys.post('/revoke')
@jwt_required
async def revoke():
    try:
        data = await request.get_json()
        api_key = data.get('api_key') if isinstance(data, dict) else None
        if not api_key or not isinstance(api_key, str):
            return jsonify({"msg": "api_key ausente ou invalida"}), 400
        revoked = key_service.revoke_key(api_key)
        if revoked:
            log_info("Chave revogada com sucesso")
            return jsonify({"revoked": True}), 200
        return jsonify({"revoked": False}), 404
    except Exception as e:
        log_error(f"Erro ao revogar chave: {str(e)}")
        return jsonify({"msg": "Erro interno do servidor"}), 500
