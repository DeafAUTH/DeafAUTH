"""
Tests for DeafAuth Flask authentication.
"""

import pytest
from app import create_app
from deafauth.models import db, User


@pytest.fixture
def app():
    """Create application for testing."""
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SECRET_KEY': 'test-secret-key'
    })
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


class TestHealthCheck:
    """Tests for health check endpoint."""
    
    def test_health_check(self, client):
        """Test health check returns healthy status."""
        response = client.get('/auth/health')
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'healthy'
        assert data['service'] == 'deafauth'


class TestSignup:
    """Tests for user signup."""
    
    def test_signup_success(self, client):
        """Test successful user signup."""
        response = client.post('/auth/signup', json={
            'email': 'test@example.com',
            'password': 'securepassword123'
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data['message'] == 'User created successfully'
        assert data['user']['email'] == 'test@example.com'
        assert 'verification_token' in data
    
    def test_signup_invalid_email(self, client):
        """Test signup with invalid email."""
        response = client.post('/auth/signup', json={
            'email': 'invalid-email',
            'password': 'securepassword123'
        })
        assert response.status_code == 400
        assert 'error' in response.get_json()
    
    def test_signup_short_password(self, client):
        """Test signup with short password."""
        response = client.post('/auth/signup', json={
            'email': 'test@example.com',
            'password': 'short'
        })
        assert response.status_code == 400
        assert 'error' in response.get_json()
    
    def test_signup_duplicate_email(self, client):
        """Test signup with duplicate email."""
        # First signup
        client.post('/auth/signup', json={
            'email': 'test@example.com',
            'password': 'securepassword123'
        })
        # Duplicate signup
        response = client.post('/auth/signup', json={
            'email': 'test@example.com',
            'password': 'anotherpassword123'
        })
        assert response.status_code == 409


class TestLogin:
    """Tests for user login."""
    
    def test_login_success(self, client):
        """Test successful login."""
        # Create user first
        client.post('/auth/signup', json={
            'email': 'test@example.com',
            'password': 'securepassword123'
        })
        
        # Login
        response = client.post('/auth/login', json={
            'email': 'test@example.com',
            'password': 'securepassword123'
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Login successful'
        assert 'token' in data
        assert data['token'].startswith('v4.local.')
    
    def test_login_wrong_password(self, client):
        """Test login with wrong password."""
        # Create user first
        client.post('/auth/signup', json={
            'email': 'test@example.com',
            'password': 'securepassword123'
        })
        
        # Login with wrong password
        response = client.post('/auth/login', json={
            'email': 'test@example.com',
            'password': 'wrongpassword'
        })
        assert response.status_code == 401
    
    def test_login_nonexistent_user(self, client):
        """Test login with nonexistent user."""
        response = client.post('/auth/login', json={
            'email': 'nonexistent@example.com',
            'password': 'securepassword123'
        })
        assert response.status_code == 401


class TestProtectedRoutes:
    """Tests for protected routes."""
    
    def test_me_with_valid_token(self, client):
        """Test /me endpoint with valid token."""
        # Create and login user
        client.post('/auth/signup', json={
            'email': 'test@example.com',
            'password': 'securepassword123'
        })
        login_response = client.post('/auth/login', json={
            'email': 'test@example.com',
            'password': 'securepassword123'
        })
        token = login_response.get_json()['token']
        
        # Access protected route
        response = client.get('/auth/me', headers={
            'Authorization': f'Bearer {token}'
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data['user']['email'] == 'test@example.com'
    
    def test_me_without_token(self, client):
        """Test /me endpoint without token."""
        response = client.get('/auth/me')
        assert response.status_code == 401
    
    def test_me_with_invalid_token(self, client):
        """Test /me endpoint with invalid token."""
        response = client.get('/auth/me', headers={
            'Authorization': 'Bearer invalid-token'
        })
        assert response.status_code == 401


class TestEmailVerification:
    """Tests for email verification."""
    
    def test_verify_email_success(self, client):
        """Test successful email verification."""
        # Create user
        signup_response = client.post('/auth/signup', json={
            'email': 'test@example.com',
            'password': 'securepassword123'
        })
        token = signup_response.get_json()['verification_token']
        
        # Verify email
        response = client.get(f'/auth/verify/{token}')
        assert response.status_code == 200
        data = response.get_json()
        assert data['user']['is_verified'] is True
    
    def test_verify_invalid_token(self, client):
        """Test verification with invalid token."""
        response = client.get('/auth/verify/invalid-token')
        assert response.status_code == 400
