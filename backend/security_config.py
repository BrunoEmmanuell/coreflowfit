from slowapi import Limiter
from slowapi.util import get_remote_address

# Define o limiter globalmente aqui
limiter = Limiter(
    key_func=get_remote_address, 
    default_limits=["200/minute"]
)