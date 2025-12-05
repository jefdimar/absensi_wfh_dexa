# Security Guide

## Secret Management

### Environment Variables

This application uses environment variables for all sensitive configuration. **NEVER commit actual secrets to version control.**

### Setup for Development

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Generate a strong JWT secret:
   ```bash
   openssl rand -base64 32
   ```

3. Update your `.env` file with the generated secret:
   ```bash
   JWT_SECRET=your_generated_secret_here
   ```

### Setup for Production

1. Copy the production template:
   ```bash
   cp .env.production .env
   ```

2. Generate a **unique** JWT secret (different from development):
   ```bash
   openssl rand -base64 32
   ```

3. Update all secrets in `.env`:
   - `JWT_SECRET` - Use the generated value
   - `DB_PASSWORD` - Use a strong database password
   - Any other sensitive configuration

4. Ensure `.env` is in `.gitignore` (already configured)

5. For production deployments, consider using:
   - Docker Secrets
   - Kubernetes Secrets
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault

### Important Security Notes

- ✅ `.env` is in `.gitignore` - never commit it
- ✅ Use different secrets for each environment
- ✅ Rotate secrets periodically (recommended: every 90 days)
- ✅ Use strong, randomly generated secrets (minimum 32 characters)
- ❌ Never hardcode secrets in source code
- ❌ Never use default/example secrets in production
- ❌ Never share secrets via email or chat

### Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `JWT_SECRET` | Yes | Secret key for JWT token signing | Generated via `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | No | JWT token expiration time | `24h`, `7d`, `30d` |
| `DB_HOST` | Yes | Database host | `localhost`, `postgres` |
| `DB_PORT` | Yes | Database port | `5432` |
| `DB_USERNAME` | Yes | Database username | `postgres` |
| `DB_PASSWORD` | Yes | Database password | Strong random password |
| `DB_NAME` | Yes | Database name | `absensi_wfh_dexa` |
| `NODE_ENV` | No | Application environment | `development`, `production` |

### Verifying Secret Configuration

Before starting services, verify your configuration:

```bash
# Check that .env exists and has JWT_SECRET
grep JWT_SECRET .env

# Ensure the secret is NOT the default value
if grep -q "CHANGE_THIS" .env; then
  echo "ERROR: Please update JWT_SECRET in .env file!"
  exit 1
fi
```

### Troubleshooting

**Error: "JWT_SECRET is not defined"**
- Ensure `.env` file exists in the root directory
- Verify `JWT_SECRET` is set in `.env`
- Restart Docker containers: `docker-compose down && docker-compose up -d`

**Error: "Invalid token"**
- JWT_SECRET may have changed - regenerate tokens
- Ensure all services use the same JWT_SECRET
- Check token expiration time

## Additional Security Recommendations

1. **Database**: Use strong passwords and restrict network access
2. **HTTPS**: Always use SSL/TLS in production (see nginx configuration)
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **CORS**: Configure allowed origins (currently allows all)
5. **Updates**: Keep dependencies up to date
6. **Backups**: Regular database backups (see backup scripts)
7. **Monitoring**: Monitor for security events and anomalies
