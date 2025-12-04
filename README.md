# DeafAuth - Flask Authentication Template

A lightweight, modular Flask-based authentication system template designed for quick project starts.

This template uses **PASETO (Platform-Agnostic SEcurity TOkens)** for authentication, a more secure alternative to JWT that eliminates common cryptographic pitfalls. Learn more at [https://paseto.io](https://paseto.io).

## Features

- **User Signup**: Register new users with email and password
- **Email Verification**: Basic email verification mechanism
- **Secure Login**: Password hashing with Werkzeug
- **PASETO Tokens**: Stateless authentication with PASETO (Platform-Agnostic SEcurity TOkens)
- **Protected Routes**: Decorator-based route protection
- **SQLite Database**: Built-in SQLite support (easily adaptable to PostgreSQL, MySQL, etc.)
- **CORS Enabled**: Works with any frontend framework

## Structure

```
deafauth/
├── app.py                 # Main Flask application entry point
├── deafauth/              # Authentication blueprint module
│   ├── __init__.py       # Blueprint initialization
│   ├── routes.py         # API endpoints (signup, login, verify)
│   ├── models.py         # User database model
│   └── auth.py           # PASETO token handling and decorators
├── static/               # Static files (CSS, JS)
├── templates/            # HTML templates
├── tests/                # Test suite
└── requirements.txt      # Python dependencies
```

## Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/deafauth/deafauth.git
cd deafauth

# Create a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration

Set environment variables (optional):

```bash
# Set a secret key for PASETO tokens (REQUIRED in production)
export SECRET_KEY="your-secret-key-here"

# Set database URL (defaults to SQLite)
export DATABASE_URL="sqlite:///deafauth.db"

# Set Flask environment
export FLASK_ENV="development"
```

### 3. Run the Application

```bash
# Run the development server
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /auth/health
```
Returns service status.

### User Signup
```
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### Email Verification
```
GET /auth/verify/<verification_token>
```

### User Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

Returns a PASETO token (starts with `v4.local.`).

### Get Current User (Protected)
```
GET /auth/me
Authorization: Bearer <token>
```

## Usage in Your Application

### Protecting Routes

Use the `@token_required` decorator to protect routes:

```python
from deafauth.auth import token_required

@app.route('/protected')
@token_required
def protected_route(user_id):
    # user_id is automatically passed by the decorator
    return jsonify({'message': f'Hello user {user_id}!'})
```

## Why PASETO?

PASETO (Platform-Agnostic SEcurity TOkens) offers several advantages over JWT:

- **Secure by default**: No algorithm selection attacks
- **Versioned protocol**: Each version is a complete specification
- **No footguns**: Removes dangerous features that cause JWT vulnerabilities
- **Built-in encryption**: v4.local provides authenticated encryption

Learn more: [https://paseto.io](https://paseto.io)

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov=deafauth
```

## Docker Deployment

```bash
# Build the image
docker build -t deafauth .

# Run the container
docker run -p 8000:8000 -e SECRET_KEY=your-secret deafauth
```

## Production Deployment

```bash
# Install Gunicorn
pip install gunicorn

# Run with 4 worker processes
gunicorn -w 4 -b 0.0.0.0:8000 "app:create_app()"
```

## Security Considerations

⚠️ **Important for Production:**

1. **Secret Key**: Set a strong `SECRET_KEY` environment variable
2. **HTTPS**: Use HTTPS in production to protect tokens in transit
3. **Database**: Use PostgreSQL or MySQL instead of SQLite
4. **Rate Limiting**: Implement rate limiting for signup/login endpoints

## License

This template is provided as-is for use in your projects.

## Version

**DeafAuth v0.1** - Initial release with basic authentication features.
