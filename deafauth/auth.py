"""
PASETO token handling and authentication decorators.
"""

import os
import hashlib
from datetime import datetime, timedelta, timezone
from functools import wraps

from flask import request, jsonify, current_app
import pyseto
from pyseto import Key


def get_paseto_key():
    """Get or create the PASETO symmetric key from SECRET_KEY."""
    secret_key = current_app.config.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    # Hash the secret key to ensure it's exactly 32 bytes for PASETO v4.local
    key_bytes = hashlib.sha256(secret_key.encode()).digest()
    return Key.new(version=4, purpose="local", key=key_bytes)


def generate_token(user_id: int, expires_in: int = 3600) -> str:
    """
    Generate a PASETO token for a user.
    
    Args:
        user_id: The user's ID to encode in the token
        expires_in: Token expiration time in seconds (default: 1 hour)
    
    Returns:
        The encoded PASETO token string
    """
    key = get_paseto_key()
    
    # Create token payload
    exp = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    payload = {
        'sub': str(user_id),
        'exp': exp.isoformat(),
        'iat': datetime.now(timezone.utc).isoformat()
    }
    
    # Encode the token
    token = pyseto.encode(key, payload)
    return token.decode('utf-8') if isinstance(token, bytes) else token


def verify_token(token: str) -> dict | None:
    """
    Verify and decode a PASETO token.
    
    Args:
        token: The PASETO token string to verify
    
    Returns:
        The decoded payload if valid, None otherwise
    """
    import json
    try:
        key = get_paseto_key()
        decoded = pyseto.decode(key, token)
        payload_bytes = decoded.payload
        
        # Decode bytes to dict if needed
        if isinstance(payload_bytes, bytes):
            payload = json.loads(payload_bytes.decode('utf-8'))
        else:
            payload = payload_bytes
        
        # Check expiration
        exp = datetime.fromisoformat(payload['exp'])
        if exp < datetime.now(timezone.utc):
            return None
        
        return payload
    except Exception as e:
        current_app.logger.debug(f"Token verification failed: {e}")
        return None


def token_required(f):
    """
    Decorator to protect routes that require authentication.
    
    The decorated function will receive user_id as the first argument.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                token = parts[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Token is invalid or expired'}), 401
        
        user_id = int(payload['sub'])
        return f(user_id, *args, **kwargs)
    
    return decorated
