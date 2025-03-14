# HawkHire Deployment Guide

This document explains how to deploy the HawkHire monorepo to your server environments.

## Prerequisites

- SSH access to your server(s)
- Proper permissions on the server to install packages and services
- Public key authentication set up (recommended)
- PM2 installed on the server (`npm install -g pm2`)
- Python 3.8+ installed on the server
- Node.js 18+ installed on the server

## Before Deployment: Fix Hardcoded Values

Before deploying, you should apply the patches to fix hardcoded values in the codebase:

```bash
# Apply the patches to fix hardcoded values
patch -p0 < patches/fix-hardcoded-api-routes.patch
patch -p0 < patches/fix-cors-origins.patch
```

These patches fix issues with hardcoded localhost references that would cause problems in production.

## Configuration

The deployment script uses a configuration file (`.deploy.conf`) to store server credentials and paths. This file is automatically created on first run with default values:

```bash
# HawkHire deployment configuration
VPS_IP="82.29.197.137"
VPS_USER="root"
FRONTEND_DIR="/var/www/beta.hawkhire.ai"
BACKEND_DIR="/var/www/api.hawkhire.ai"
FASTAPI_DIR="/var/www/fastapi.hawkhire.ai"
```

**Important**: Edit this file with your actual deployment values. For security reasons:
- The configuration file is set to be read-only by the owner (chmod 600)
- Consider using a non-root user with appropriate permissions
- This file is excluded from version control in `.gitignore`

## Environment Files

The deployment script looks for environment-specific variables in these locations:
- Frontend: `.env.{environment}` (e.g., `.env.production`, `.env.staging`)
- Backend: `backend/.env.{environment}` (e.g., `backend/.env.production`)

If these files don't exist, the script will fall back to `.env.local` and `backend/.env` respectively.

Example files `.env.production` and `backend/.env.production` have been created as templates. Copy these and update with your actual environment values.

### Required Environment Variables

Make sure your environment files include all the required variables:

**Frontend must include:**
```
NEXT_PUBLIC_API_URL=https://api.hawkhire.ai
PYTHON_API_URL=https://api.hawkhire.ai
NEXT_PUBLIC_SITE_URL=https://beta.hawkhire.ai
PORT=3000
```

**Backend must include:**
```
FRONTEND_URL=https://beta.hawkhire.ai
CORS_ORIGINS=https://beta.hawkhire.ai,https://hawkhire.ai,https://www.hawkhire.ai
```

### Supabase Configuration

This application uses Supabase for database and authentication. Make sure your environment files include the following Supabase-specific variables:

**Frontend (.env.{environment}):**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SUPABASE_DISABLE_EMAIL_VERIFICATION=false
```

**Backend (backend/.env.{environment}):**
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres:password@db.your-project-id.supabase.co:5432/postgres
```

You can find these values in your Supabase project dashboard under Project Settings > API.

## Usage

The deployment script can deploy the frontend, backend, or both components to your server.

### Basic Usage

```bash
# Deploy both frontend and backend to production (default)
./deploy.sh

# Deploy only the frontend to production
./deploy.sh frontend

# Deploy only the backend to production
./deploy.sh backend

# Deploy both to production (explicitly)
./deploy.sh all production

# Deploy to a different environment (staging, development, etc.)
./deploy.sh all staging
./deploy.sh frontend development

# Show help
./deploy.sh help
```

### What the Script Does

1. **For frontend deployment**:
   - Backs up the current frontend deployment (if any)
   - Copies the Next.js files to the server
   - Copies the appropriate environment file
   - Installs dependencies and builds the application
   - Configures PM2 to run the Next.js application

2. **For backend deployment**:
   - Backs up the current backend deployment (if any)
   - Copies the FastAPI files to the server
   - Copies the appropriate environment file
   - Sets up a Python virtual environment
   - Installs dependencies (including psycopg2 for PostgreSQL/Supabase)
   - Runs database migrations (if configured)
   - Verifies database connection to Supabase
   - Configures PM2 to run the FastAPI application

## Adding New Environments

To add support for a new deployment environment (e.g., "testing"):

1. Create the appropriate environment files:
   - `.env.testing` for frontend
   - `backend/.env.testing` for backend

2. Deploy using the environment name:
   ```bash
   ./deploy.sh all testing
   ```

## Troubleshooting

### Common Issues

1. **SSH connection fails**:
   - Ensure your SSH key is added to the server
   - Check if the IP address is correct
   - Verify you have the right permissions

2. **Deployment fails with permission errors**:
   - Check that your user has write permissions to the target directories
   - Consider using a non-root user with sudo privileges

3. **Application doesn't start after deployment**:
   - Check PM2 logs: `ssh user@server "pm2 logs"`
   - Verify environment variables are set correctly
   - Check for syntax errors in your code

4. **Database connection issues**:
   - Ensure your Supabase credentials are correct
   - Check network connectivity to Supabase from your server
   - Verify IP allowlist settings in Supabase dashboard

5. **API connectivity issues**:
   - If you see 'Connection refused' errors, check that you don't have hardcoded localhost values
   - Verify that the correct API URLs are set in environment variables

### Supabase-Specific Troubleshooting

1. **Database connection fails**:
   - Check that your `DATABASE_URL` is correctly formatted
   - Ensure you have allowed server IP in Supabase dashboard (Project Settings > Database > Connection Pooling)
   - Try connecting manually to test: `psql "your-connection-string"`

2. **Authentication issues**:
   - Verify ANON_KEY and SERVICE_ROLE_KEY are correct
   - Check JWT expiration settings in Supabase dashboard
   - For development, you may need to enable `NEXT_PUBLIC_SUPABASE_DISABLE_EMAIL_VERIFICATION`

## Security Considerations

- Never commit `.deploy.conf` or any `.env.*` files to version control
- Use a dedicated deployment user instead of root
- Consider using SSH key authentication instead of passwords
- Set up proper file permissions on the server
- Be especially careful with the Supabase SERVICE_ROLE_KEY, which has admin privileges

## Advanced Configuration

You can modify the deployment script to add additional functionality:

- Add support for database migrations
- Implement continuous integration (CI) support
- Add notification hooks (Slack, Email, etc.)
- Implement more robust error handling and recovery 