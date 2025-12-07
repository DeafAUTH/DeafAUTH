#!/bin/bash
# Generate PASETO Ed25519 keys for DeafAUTH API Server

set -e

KEYS_DIR="${1:-./keys}"

echo "🔐 DeafAUTH PASETO Key Generator"
echo "================================"
echo ""

# Create keys directory if it doesn't exist
if [ ! -d "$KEYS_DIR" ]; then
    echo "📁 Creating keys directory: $KEYS_DIR"
    mkdir -p "$KEYS_DIR"
fi

# Check if keys already exist
if [ -f "$KEYS_DIR/paseto_private.pem" ] || [ -f "$KEYS_DIR/paseto_public.pem" ]; then
    echo "⚠️  WARNING: Keys already exist in $KEYS_DIR"
    echo ""
    read -p "Do you want to overwrite them? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "❌ Aborted. Existing keys preserved."
        exit 1
    fi
    echo "♻️  Regenerating keys..."
fi

# Generate Ed25519 private key
echo "🔑 Generating Ed25519 private key..."
openssl genpkey -algorithm Ed25519 -out "$KEYS_DIR/paseto_private.pem"

# Extract public key
echo "🔓 Extracting public key..."
openssl pkey -in "$KEYS_DIR/paseto_private.pem" -pubout -out "$KEYS_DIR/paseto_public.pem"

# Set proper permissions
echo "🔒 Setting secure permissions..."
chmod 600 "$KEYS_DIR/paseto_private.pem"
chmod 644 "$KEYS_DIR/paseto_public.pem"

echo ""
echo "✅ PASETO keys generated successfully!"
echo ""
echo "📁 Key locations:"
echo "   Private key: $KEYS_DIR/paseto_private.pem (mode: 600)"
echo "   Public key:  $KEYS_DIR/paseto_public.pem (mode: 644)"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "   1. Keep paseto_private.pem SECRET and SECURE"
echo "   2. Never commit private keys to version control"
echo "   3. In production, use a secure vault (not filesystem)"
echo "   4. Rotate keys periodically"
echo ""
echo "📝 Next steps:"
echo "   1. Add keys directory to .gitignore"
echo "   2. For production: Store keys in environment variables or vault"
echo "   3. Configure PASETO_PRIVATE_KEY and PASETO_PUBLIC_KEY in .env"
echo ""
echo "🚀 Ready to start DeafAUTH API Server!"
