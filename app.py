"""
DeafAuth - Flask Application Entry Point

A lightweight, modular authentication system using PASETO tokens.
Run with: python app.py
"""

import os
from flask import Flask, render_template, send_from_directory
from flask_cors import CORS

from deafauth import auth_bp
from deafauth.models import db


def create_app(config=None):
    """
    Application factory for creating Flask app instances.
    
    Args:
        config: Optional dictionary of configuration overrides
    
    Returns:
        Configured Flask application instance
    """
    app = Flask(__name__, static_folder='static', template_folder='templates')
    
    # Default configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///deafauth.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Apply custom configuration
    if config:
        app.config.update(config)
    
    # Initialize extensions
    db.init_app(app)
    
    # Enable CORS for agnostic frontend support
    # In production, set CORS_ORIGINS environment variable to restrict origins
    cors_origins = os.environ.get('CORS_ORIGINS', '*')
    CORS(app, resources={
        r"/auth/*": {
            "origins": cors_origins.split(',') if cors_origins != '*' else '*',
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Root endpoint - serve the web UI
    @app.route('/')
    def index():
        return render_template('index.html')
    
    # API info endpoint
    @app.route('/api')
    def api_info():
        return {
            'service': 'DeafAuth',
            'version': '0.1.0',
            'description': 'Agnostic authentication API using PASETO tokens',
            'endpoints': {
                'health': '/auth/health',
                'signup': '/auth/signup',
                'login': '/auth/login',
                'verify': '/auth/verify/<token>',
                'me': '/auth/me'
            }
        }
    
    return app


if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
