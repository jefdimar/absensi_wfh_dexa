# SSL/TLS Certificate Setup Guide

This guide explains how to set up HTTPS/SSL for the Absensi WFH Dexa application.

## Table of Contents

1. [Quick Start (Development)](#quick-start-development)
2. [Production Setup with Let's Encrypt](#production-setup-with-lets-encrypt)
3. [Custom SSL Certificates](#custom-ssl-certificates)
4. [Testing HTTPS Locally](#testing-https-locally)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start (Development)

For local development and testing, use self-signed certificates:

### Step 1: Create Self-Signed Certificate

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Generate self-signed certificate (valid for 365 days)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### Step 2: Start with HTTPS

```bash
# Use the SSL-enabled configuration
docker-compose -f docker-compose.yml up -d

# Or use production compose file
docker-compose -f docker-compose.production.yml up -d
```

### Step 3: Access the Application

```
https://localhost
```

**Note:** Your browser will show a security warning because the certificate is self-signed. This is normal for development.

---

## Production Setup with Let's Encrypt

Let's Encrypt provides free, automated SSL certificates. Recommended for production.

### Prerequisites

- A registered domain name pointing to your server
- Ports 80 and 443 accessible from the internet
- Docker and Docker Compose installed

### Step 1: Prepare Directory Structure

```bash
mkdir -p nginx/certbot/www
mkdir -p nginx/certbot/conf
mkdir -p nginx/ssl
```

### Step 2: Initial Certificate Request

First, we need to get the initial certificate using HTTP validation:

```bash
# Temporarily use HTTP-only nginx config
docker-compose up -d nginx

# Request certificate (replace with your domain and email)
docker run --rm \
  -v $(pwd)/nginx/certbot/www:/var/www/certbot \
  -v $(pwd)/nginx/certbot/conf:/etc/letsencrypt \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d your-domain.com \
  -d www.your-domain.com
```

### Step 3: Update Nginx Configuration

Edit `nginx/nginx-ssl.conf`:

```nginx
# Change this line:
server_name localhost;

# To your domain:
server_name your-domain.com www.your-domain.com;

# Update certificate paths:
ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

### Step 4: Start Production Stack

```bash
# Stop current containers
docker-compose down

# Start with production configuration
docker-compose -f docker-compose.production.yml up -d
```

### Step 5: Verify HTTPS

```bash
# Test HTTPS connection
curl -I https://your-domain.com/health

# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com < /dev/null
```

### Step 6: Automatic Renewal

The `certbot` container in `docker-compose.production.yml` automatically renews certificates every 12 hours.

Verify renewal works:

```bash
# Test renewal (dry run)
docker-compose exec certbot certbot renew --dry-run
```

---

## Custom SSL Certificates

If you have custom SSL certificates from a Certificate Authority:

### Step 1: Place Certificate Files

```bash
# Copy your certificate and key to the SSL directory
cp your-certificate.crt nginx/ssl/cert.pem
cp your-private-key.key nginx/ssl/key.pem

# If you have a CA bundle/intermediate certificates
cp your-ca-bundle.crt nginx/ssl/ca-bundle.pem
```

### Step 2: Update Nginx Configuration

If using a CA bundle, update `nginx/nginx-ssl.conf`:

```nginx
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
ssl_trusted_certificate /etc/nginx/ssl/ca-bundle.pem;
```

### Step 3: Set Proper Permissions

```bash
chmod 600 nginx/ssl/key.pem
chmod 644 nginx/ssl/cert.pem
```

### Step 4: Restart Nginx

```bash
docker-compose restart nginx
```

---

## Testing HTTPS Locally

### Option 1: Self-Signed Certificate (Easiest)

```bash
# Generate certificate
./scripts/generate-ssl-cert.sh  # We'll create this script

# Start services
docker-compose up -d

# Test
curl -k https://localhost/health  # -k ignores certificate warning
```

### Option 2: Local CA with mkcert (Recommended)

Install [mkcert](https://github.com/FiloSottile/mkcert) for trusted local certificates:

```bash
# Install mkcert (macOS)
brew install mkcert
mkcert -install

# Or Linux
wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert-v1.4.4-linux-amd64
sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert
mkcert -install

# Generate certificate for localhost
cd nginx/ssl
mkcert localhost 127.0.0.1 ::1

# Rename files
mv localhost+2.pem cert.pem
mv localhost+2-key.pem key.pem

# Start services
docker-compose up -d

# Test (no warning!)
curl https://localhost/health
```

---

## Configuration Files

### Development (HTTP + HTTPS)

Use `nginx/nginx.conf` - serves both HTTP (80) and can be tested with self-signed certs.

### Production (HTTPS only with redirect)

Use `nginx/nginx-ssl.conf` - redirects all HTTP to HTTPS with production-grade security.

### Docker Compose Files

- `docker-compose.yml` - Development setup
- `docker-compose.production.yml` - Production setup with SSL and higher resource limits

---

## Security Best Practices

### 1. Certificate Security

```bash
# Restrict key file permissions
chmod 600 nginx/ssl/*.key nginx/ssl/key.pem

# Only nginx user needs access
chown root:root nginx/ssl/*
```

### 2. Test SSL Configuration

Use [SSL Labs](https://www.ssllabs.com/ssltest/) to test your production configuration:

```
https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
```

Expected grade: **A** or **A+**

### 3. Enable HSTS

Already configured in `nginx-ssl.conf`:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

This ensures browsers always use HTTPS.

### 4. Monitor Certificate Expiry

Let's Encrypt certificates expire every 90 days. Monitor with:

```bash
# Check expiry date
openssl x509 -in nginx/certbot/conf/live/your-domain.com/cert.pem -noout -dates

# Or use a monitoring service
# - UptimeRobot
# - StatusCake
# - Pingdom
```

### 5. Update SSL Configuration Regularly

TLS protocols and ciphers evolve. Review configuration annually:

- Visit [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- Select "nginx" and "modern" or "intermediate" profile
- Update `nginx-ssl.conf` with recommended settings

---

## Troubleshooting

### Issue: "Certificate Not Trusted" in Browser

**Cause:** Self-signed certificate or missing CA bundle

**Solution:**
- For development: Accept the warning or use mkcert
- For production: Ensure Let's Encrypt or CA certificates are properly configured

### Issue: "Connection Refused" on Port 443

**Cause:** Nginx not listening on 443 or port blocked

**Solution:**
```bash
# Check if nginx is running
docker-compose ps nginx

# Check if port is exposed
docker port absensi_gateway

# Check firewall
sudo ufw status
sudo ufw allow 443/tcp
```

### Issue: Let's Encrypt Validation Fails

**Cause:** Domain not pointing to server or port 80 blocked

**Solution:**
```bash
# Verify DNS
nslookup your-domain.com

# Verify port 80 is accessible
curl http://your-domain.com/.well-known/acme-challenge/test

# Check nginx logs
docker-compose logs nginx
```

### Issue: Certificate Renewal Fails

**Cause:** Nginx blocking ACME validation or certbot not running

**Solution:**
```bash
# Check certbot container
docker-compose ps certbot

# Manual renewal test
docker-compose exec certbot certbot renew --dry-run

# Check nginx allows ACME
curl http://your-domain.com/.well-known/acme-challenge/test
```

### Issue: Mixed Content Warnings

**Cause:** Loading HTTP resources on HTTPS page

**Solution:**
- Ensure all API calls use relative URLs or HTTPS
- Check `X-Forwarded-Proto` header is being set by nginx
- Update frontend to use `https://` or protocol-relative URLs

---

## Useful Commands

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem

# Check certificate details
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Check certificate expiry
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# Test SSL connection
openssl s_client -connect localhost:443 -servername localhost

# Test HTTPS endpoint
curl -k https://localhost/health

# View nginx SSL/TLS configuration
docker-compose exec nginx nginx -T | grep ssl

# Reload nginx configuration (without downtime)
docker-compose exec nginx nginx -s reload

# Check Let's Encrypt certificate
certbot certificates
```

---

## References

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)
- [Nginx SSL Module Documentation](https://nginx.org/en/docs/http/ngx_http_ssl_module.html)
- [mkcert - Local CA for Development](https://github.com/FiloSottile/mkcert)
