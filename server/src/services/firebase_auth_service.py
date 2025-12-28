import os
import firebase_admin
from firebase_admin import credentials, firestore
from server.src.models.user_model import User
from server.src.utils.logger import log_info, log_warn, log_error
import traceback
import asyncio

def init_firebase():
    try:
        config_paths = [
            'serviceAccountKey.json',
            '../../../serviceAccountKey.json',
            os.path.join(os.path.dirname(__file__), '../../../serviceAccountKey.json'),
            'firebaseAdminConfig.json',
            '../../../firebaseAdminConfig.json'
        ]
        
        service_account_key = None
        for path in config_paths:
            if os.path.exists(path):
                service_account_key = path
                break
        
        if not service_account_key:
            log_error(f'Arquivo de configuração do Firebase não encontrado')
            return None
        
        if not firebase_admin._apps:
            cred = credentials.Certificate(service_account_key)
            firebase_admin.initialize_app(cred)
            log_info('Firebase inicializado com sucesso')
        
        return firestore.client()
    except Exception as e:
        log_error(f'Erro ao inicializar Firebase: {str(e)}')
        return None

firebase_db = init_firebase()
USERS_COLLECTION = 'users'
last_error: str | None = None

def get_last_error() -> str | None:
    return last_error

def clear_last_error() -> None:
    global last_error
    last_error = None

async def get_user_by_username(username: str) -> User | None:
    if not firebase_db:
        global last_error
        last_error = 'Firebase não inicializado'
        log_error(last_error)
        return None
    
    try:
        docs = firebase_db.collection(USERS_COLLECTION).where('username', '==', username).limit(1).stream()
        
        for doc in docs:
            user_data = doc.to_dict()
            user = User(
                id=user_data.get('id'),
                username=user_data.get('username'),
                email=user_data.get('email')
            )
            user.password_hashed = user_data.get('password_hashed', '')
            return user
        
        return None
    except Exception as e:
        last_error = f'Erro ao buscar usuário: {str(e)}'
        log_error(last_error)
        return None

async def get_user_by_id(user_id: int) -> User | None:
    if not firebase_db:
        global last_error
        last_error = 'Firebase não inicializado'
        log_error(last_error)
        return None
    
    try:
        doc = firebase_db.collection(USERS_COLLECTION).document(str(user_id)).get()
        
        if not doc.exists:
            return None
        
        user_data = doc.to_dict()
        user = User(
            id=user_data.get('id'),
            username=user_data.get('username'),
            email=user_data.get('email')
        )
        user.password_hashed = user_data.get('password_hashed', '')
        return user
    except Exception as e:
        last_error = f'Erro ao buscar usuário por ID: {str(e)}'
        log_error(last_error)
        return None

async def create_user(user_id: int, username: str, email: str, password: str) -> bool:
    global last_error
    clear_last_error()
    if not firebase_db:
        last_error = 'Firebase não inicializado'
        log_error(last_error)
        return False
    
    if not isinstance(user_id, int) or user_id <= 0:
        last_error = 'user_id inválido'
        log_error(last_error)
        return False
    if not isinstance(username, str) or not username or len(username) > 50:
        last_error = 'username inválido'
        log_error(last_error)
        return False
    if not isinstance(email, str) or not email or len(email) > 254:
        last_error = 'email inválido'
        log_error(last_error)
        return False
    if not isinstance(password, str) or not password or len(password) > 256:
        last_error = 'password inválido'
        log_error(last_error)
        return False

    try:
        existing = await get_user_by_username(username)
        if existing:
            last_error = f'Usuário já existe: {username}'
            log_warn(last_error)
            return False
        
        user = User(id=user_id, username=username, email=email)
        user.set_password(password)
        
        user_data = {
            'id': user_id,
            'username': username,
            'email': email,
            'password_hashed': user.password_hashed,
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP,
            'active': True
        }
        
        firebase_db.collection(USERS_COLLECTION).document(str(user_id)).set(user_data)
        log_info(f'Usuário criado no Firebase: {username}')
        return True
    except Exception as e:
        last_error = f'Erro ao criar usuário: {str(e)}'
        log_error(last_error)
        return False

async def authenticate(username: str, password: str) -> User | None:
    if not firebase_db:
        global last_error
        last_error = 'Firebase não inicializado'
        log_error(last_error)
        return None
    
    if not isinstance(username, str) or not isinstance(password, str):
        log_warn('Tentativa de autenticação com tipos inválidos')
        return None
    
    if not username or not password:
        log_warn('Tentativa de autenticação com credenciais vazias')
        return None
    
    if len(username) > 50 or len(password) > 256:
        log_warn('Credenciais com tamanho inválido')
        return None
    
    try:
        user = await get_user_by_username(username)
        
        if not user:
            log_warn(f'Usuário não encontrado: {username}')
            return None
        
        if not user.check_password(password):
            log_warn(f'Senha incorreta para usuário: {username}')
            return None
        
        log_info(f'Usuário autenticado com sucesso: {username}')
        return user
    except Exception as e:
        last_error = f'Erro ao autenticar: {str(e)}'
        log_error(last_error)
        return None

def init_default_admin():
    try:
        if not firebase_db:
            log_error('Firebase não inicializado')
            return
        
        docs = firebase_db.collection(USERS_COLLECTION).where('username', '==', 'admin').limit(1).stream()
        
        admin_exists = False
        for doc in docs:
            admin_exists = True
            break
        
        if not admin_exists:
            admin_user = User(id=1, username='admin', email='admin@sweethome.local')
            admin_user.set_password('Admin@12345')
            
            user_data = {
                'id': 1,
                'username': 'admin',
                'email': 'admin@sweethome.local',
                'password_hashed': admin_user.password_hashed,
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP,
                'active': True,
                'is_admin': True
            }
            
            firebase_db.collection(USERS_COLLECTION).document('1').set(user_data)
            log_info('Admin user created in Firebase')
        else:
            log_info('Admin user already exists in Firebase')
    except Exception as e:
        log_error(f'Erro ao inicializar admin: {str(e)}')

if firebase_db:
    try:
        init_default_admin()
    except Exception as e:
        log_error(f'Erro ao inicializar admin na importação: {str(e)}')

def register_user(user_id: int, username: str, email: str, password: str) -> bool:
    global last_error
    clear_last_error()
    try:
        try:
            result = asyncio.run(create_user(user_id, username, email, password))
            if result:
                log_info(f'Usuario registrado (sync): {username}')
            return result
        except RuntimeError as e:
            if 'Event loop ja esta rodando' in str(e):
                last_error = 'Event loop ja esta rodando'
                log_warn(last_error)
                return False
            raise
    except Exception as e:
        last_error = f'Erro ao chamar register_user: {str(e)}'
        log_error(last_error)
        return False

async def register_user_async(user_id: int, username: str, email: str, password: str) -> bool:
    global last_error
    clear_last_error()
    try:
        result = await create_user(user_id, username, email, password)
        if result:
            log_info(f'Usuario registrado (async): {username}')
        return result
    except Exception as e:
        last_error = f'Erro ao chamar register_user_async: {str(e)}'
        log_error(last_error)
        return False