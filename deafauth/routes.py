"""
API routes for DeafAuth authentication.
"""

import secrets
import re

from flask import request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash

from . import auth_bp
from .models import db, User
from .auth import generate_token, token_required


def is_valid_email(email: str) -> bool:
    """Basic email validation."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


@auth_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'deafauth'
    })


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    # Validate email
    if not email or not is_valid_email(email):
        return jsonify({'error': 'Valid email is required'}), 400
    
    # Validate password
    if not password or len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': 'Email already registered'}), 409
    
    # Create new user
    verification_token = secrets.token_urlsafe(32)
    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        verification_token=verification_token,
        is_verified=False
    )
    
    try:
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Database error during signup: {e}")
        return jsonify({'error': 'Failed to create user'}), 500
    
    return jsonify({
        'message': 'User created successfully',
        'user': user.to_dict(),
        'verification_token': verification_token,
        'note': 'In production, verification token would be sent via email'
    }), 201


@auth_bp.route('/verify/<token>', methods=['GET'])
def verify_email(token):
    """Verify user email with token."""
    user = User.query.filter_by(verification_token=token).first()
    
    if not user:
        return jsonify({'error': 'Invalid verification token'}), 400
    
    if user.is_verified:
        return jsonify({'message': 'Email already verified', 'user': user.to_dict()})
    
    user.is_verified = True
    user.verification_token = None
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Database error during verification: {e}")
        return jsonify({'error': 'Failed to verify email'}), 500
    
    return jsonify({
        'message': 'Email verified successfully',
        'user': user.to_dict()
    })


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return PASETO token."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Generate PASETO token
    token = generate_token(user.id)
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    })


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(user_id):
    """Get current authenticated user."""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()})
