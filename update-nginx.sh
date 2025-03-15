#!/bin/bash

# Script to update Nginx configuration for Next.js static assets
# Usage: ./update-nginx.sh

# Configuration
VPS_IP="82.29.197.137"
VPS_USER="root"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Warning function
warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Error function
error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if SSH connection works
check_ssh_connection() {
    log "Checking SSH connection to $VPS_USER@$VPS_IP..."
    if ! ssh -q "$VPS_USER@$VPS_IP" exit; then
        error "SSH connection failed. Please check your credentials and connection."
    fi
}

# Main execution
main() {
    # Check SSH connection first
    check_ssh_connection
    
    log "Creating updated Nginx configuration..."
    
    # Create a temporary file with the updated Nginx configuration
    cat > nginx-beta.hawkhire.ai << 'EOF'
server {
    server_name beta.hawkhire.ai;
    
    # Include security headers
    include /etc/nginx/snippets/security-headers.conf;
   
    # Important: Add this location block to properly handle Next.js static assets
    location /_next/static {
        alias /var/www/beta.hawkhire.ai/.next/static;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # Handle other static files
    location /static {
        alias /var/www/beta.hawkhire.ai/public/static;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # Handle public files
    location /public {
        alias /var/www/beta.hawkhire.ai/public;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # Handle favicon and other root files
    location ~ ^/(favicon\.ico|robots\.txt|sitemap\.xml)$ {
        root /var/www/beta.hawkhire.ai/public;
    }
    
    # Proxy all other requests to the Next.js server
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/www.hawkhire.ai/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/www.hawkhire.ai/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = beta.hawkhire.ai) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name beta.hawkhire.ai;
    return 404; # managed by Certbot
}
EOF
    
    # Copy the Nginx configuration to the server
    log "Copying updated Nginx configuration to server..."
    scp nginx-beta.hawkhire.ai "$VPS_USER@$VPS_IP:/etc/nginx/sites-available/beta.hawkhire.ai"
    
    # Test Nginx configuration
    log "Testing Nginx configuration..."
    ssh "$VPS_USER@$VPS_IP" "nginx -t"
    
    # Restart Nginx
    log "Restarting Nginx..."
    ssh "$VPS_USER@$VPS_IP" "systemctl restart nginx"
    
    # Clean up the local temporary file
    rm nginx-beta.hawkhire.ai
    
    log "Nginx configuration updated successfully!"
    log "Please check https://beta.hawkhire.ai/test.html to see if CSS is now working."
}

# Run the main function
main "$@" 