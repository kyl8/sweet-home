import logging

from models.user_model import User

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

user1 = User(id=1, username="Mari", email="Mari@mari")
user2 = User(id=2, username="Gabi", email="Gabi@gabi")
user1.set_password("123123")
user2.set_password("123123")

db_usuarios = {
    user1.id: user1,
    user2.id: user2
}


async def authenticate(username: str, password: str) -> User | None:
    """Authenticate user by username and password."""
    logging.info(f"Authenticating user: {username}")
    for user in db_usuarios.values():
        if user.username == username and user.check_password(password):
            logging.info(f"User {username} authenticated successfully.")
            return user
    logging.warning(f"Authentication failed for user: {username}")
    return None

async def get_user_by_id(user_id: int) -> User | None:
    """Retrieve user by their ID."""
    logging.info(f"Fetching user with ID: {user_id}")
    return db_usuarios.get(user_id, None)



