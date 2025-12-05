#!/bin/bash

# Generate Self-Signed SSL Certificate for Development
# This script creates a self-signed certificate for local HTTPS testing

set -e

echo "========================================="
echo "SSL Certificate Generator (Development)"
echo "========================================="
echo ""

# Configuration
SSL_DIR="nginx/ssl"
CERT_FILE="$SSL_DIR/cert.pem"
KEY_FILE="$SSL_DIR/key.pem"
DAYS_VALID=365

# Certificate details
COUNTRY="US"
STATE="State"
CITY="City"
ORG="Absensi WFH Dexa"
CN="localhost"

echo "Configuration:"
echo "  Certificate will be valid for: $DAYS_VALID days"
echo "  Common Name (CN): $CN"
echo "  Output directory: $SSL_DIR"
echo ""

# Create SSL directory if it doesn't exist
if [ ! -d "$SSL_DIR" ]; then
    echo "Creating SSL directory..."
    mkdir -p "$SSL_DIR"
    echo "✓ Directory created"
else
    echo "✓ SSL directory exists"
fi

# Check if certificates already exist
if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    echo ""
    echo "⚠️  Warning: SSL certificates already exist!"
    echo "  Certificate: $CERT_FILE"
    echo "  Private Key: $KEY_FILE"
    echo ""
    read -p "Overwrite existing certificates? (yes/no): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        echo "Operation cancelled."
        exit 0
    fi

    echo "Backing up existing certificates..."
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    mv "$CERT_FILE" "$CERT_FILE.backup_$TIMESTAMP"
    mv "$KEY_FILE" "$KEY_FILE.backup_$TIMESTAMP"
    echo "✓ Backup created"
fi

echo ""
echo "Generating self-signed certificate..."
echo ""

# Generate self-signed certificate
openssl req -x509 -nodes -days $DAYS_VALID -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/CN=$CN" \
    -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1,IP:::1"

if [ $? -eq 0 ]; then
    echo "✓ Certificate generated successfully"
else
    echo "✗ Certificate generation failed!"
    exit 1
fi

# Set appropriate permissions
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"
echo "✓ Permissions set"

# Display certificate information
echo ""
echo "========================================="
echo "Certificate Details"
echo "========================================="
openssl x509 -in "$CERT_FILE" -noout -subject -dates
echo ""

# File sizes
CERT_SIZE=$(du -h "$CERT_FILE" | cut -f1)
KEY_SIZE=$(du -h "$KEY_FILE" | cut -f1)

echo "Files created:"
echo "  Certificate: $CERT_FILE ($CERT_SIZE)"
echo "  Private Key: $KEY_FILE ($KEY_SIZE)"
echo ""

echo "========================================="
echo "Next Steps"
echo "========================================="
echo ""
echo "1. Start the application with HTTPS:"
echo "   docker-compose up -d"
echo ""
echo "2. Access the application:"
echo "   https://localhost"
echo ""
echo "3. Your browser will show a security warning because"
echo "   this is a self-signed certificate. This is normal for"
echo "   development. Click 'Advanced' and 'Proceed' to continue."
echo ""
echo "4. For production, use Let's Encrypt certificates instead:"
echo "   See nginx/SSL_SETUP.md for instructions"
echo ""
echo "⚠️  Note: This certificate should ONLY be used for development!"
echo "   Never use self-signed certificates in production."
echo ""
