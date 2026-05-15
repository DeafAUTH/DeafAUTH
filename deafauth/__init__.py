"""
DeafAuth - Flask Authentication Blueprint

A lightweight, modular authentication system using PASETO tokens.
"""

from flask import Blueprint

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

from . import routes  # noqa: E402, F401
