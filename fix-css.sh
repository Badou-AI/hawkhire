#!/bin/bash

# Script to fix CSS issues on the server
# Usage: ./fix-css.sh

# Configuration
VPS_IP="82.29.197.137"
VPS_USER="root"
FRONTEND_DIR="/var/www/beta.hawkhire.ai"

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

# Fix Nginx configuration for Next.js static assets
fix_nginx_config() {
    log "Fixing Nginx configuration for Next.js static assets..."
    
    # Create a temporary file with the updated Nginx configuration
    cat > nginx-hawkhire.conf << 'EOF'
server {
    listen 80;
    server_name beta.hawkhire.ai;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name beta.hawkhire.ai;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/beta.hawkhire.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/beta.hawkhire.ai/privkey.pem;
    
    # Root directory
    root /var/www/beta.hawkhire.ai;
    
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
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
    
    # Copy the Nginx configuration to the server
    scp nginx-hawkhire.conf "$VPS_USER@$VPS_IP:/etc/nginx/sites-available/beta.hawkhire.ai"
    
    # Create a symbolic link if it doesn't exist
    ssh "$VPS_USER@$VPS_IP" "ln -sf /etc/nginx/sites-available/beta.hawkhire.ai /etc/nginx/sites-enabled/beta.hawkhire.ai"
    
    # Test Nginx configuration
    ssh "$VPS_USER@$VPS_IP" "nginx -t"
    
    # Restart Nginx
    ssh "$VPS_USER@$VPS_IP" "systemctl restart nginx"
    
    # Clean up the local temporary file
    rm nginx-hawkhire.conf
    
    log "Nginx configuration updated successfully!"
}

# Create a custom CSS file
create_custom_css() {
    log "Creating a custom CSS file..."
    
    # Create a temporary file with the custom CSS
    cat > custom.css << 'EOF'
/* Custom CSS for testing */
body {
  font-family: Arial, sans-serif !important;
  margin: 0 !important;
  padding: 0 !important;
  background-color: #f5f5f5 !important;
}

.container {
  max-width: 800px !important;
  margin: 0 auto !important;
  padding: 20px !important;
  background-color: white !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  margin-top: 50px !important;
}

h1 {
  color: #333 !important;
  font-size: 24px !important;
  margin-bottom: 20px !important;
}

p {
  color: #666 !important;
  line-height: 1.6 !important;
}

.button {
  display: inline-block !important;
  background-color: #4f46e5 !important;
  color: white !important;
  padding: 10px 20px !important;
  border-radius: 4px !important;
  text-decoration: none !important;
  font-weight: bold !important;
  margin-top: 20px !important;
  cursor: pointer !important;
  border: none !important;
}

.button:hover {
  background-color: #4338ca !important;
}
EOF
    
    # Copy the custom CSS to the server
    scp custom.css "$VPS_USER@$VPS_IP:$FRONTEND_DIR/public/custom.css"
    
    # Clean up the local temporary file
    rm custom.css
    
    log "Custom CSS file created successfully!"
}

# Create a test HTML file
create_test_html() {
    log "Creating a test HTML file..."
    
    # Create a temporary file with the test HTML
    cat > test3.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Test 3</title>
  <link rel="stylesheet" href="/custom.css">
</head>
<body>
  <div class="container">
    <h1>Test Page with Custom CSS</h1>
    <p>This is a test page with a custom CSS file to check if CSS is working properly.</p>
    <button class="button">Test Button</button>
  </div>
</body>
</html>
EOF
    
    # Copy the test HTML to the server
    scp test3.html "$VPS_USER@$VPS_IP:$FRONTEND_DIR/public/test3.html"
    
    # Clean up the local temporary file
    rm test3.html
    
    log "Test HTML file created successfully!"
}

# Check Next.js build configuration
check_nextjs_config() {
    log "Checking Next.js configuration..."
    
    # Create a script to check and update Next.js configuration
    cat > check-nextjs-config.sh << 'EOF'
#!/bin/bash

cd /var/www/beta.hawkhire.ai

# Check if next.config.js exists
if [ -f next.config.js ]; then
    echo "Found next.config.js"
    cat next.config.js
    
    # Check if assetPrefix is set
    if grep -q "assetPrefix" next.config.js; then
        echo "assetPrefix is already configured"
    else
        echo "Adding assetPrefix to next.config.js"
        # Create a backup
        cp next.config.js next.config.js.bak
        
        # Add assetPrefix to the configuration
        sed -i 's/module.exports = {/module.exports = {\n  assetPrefix: process.env.NODE_ENV === "production" ? "" : "",/g' next.config.js
        
        echo "Updated next.config.js:"
        cat next.config.js
    fi
else
    echo "next.config.js not found, creating it"
    cat > next.config.js << 'NEXTCONFIG'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  assetPrefix: process.env.NODE_ENV === "production" ? "" : "",
}

module.exports = nextConfig
NEXTCONFIG
    
    echo "Created next.config.js:"
    cat next.config.js
fi

# Rebuild the Next.js application
echo "Rebuilding Next.js application..."
NEXT_TELEMETRY_DISABLED=1 npx next build

# Restart the Next.js application
pm2 restart beta-hawkhire || pm2 start npm --name "beta-hawkhire" -- start

echo "Next.js configuration check complete!"
EOF
    
    # Copy the script to the server
    scp check-nextjs-config.sh "$VPS_USER@$VPS_IP:$FRONTEND_DIR/check-nextjs-config.sh"
    
    # Make the script executable and run it
    ssh "$VPS_USER@$VPS_IP" "cd $FRONTEND_DIR && chmod +x check-nextjs-config.sh && ./check-nextjs-config.sh"
    
    # Clean up
    ssh "$VPS_USER@$VPS_IP" "cd $FRONTEND_DIR && rm check-nextjs-config.sh"
    rm check-nextjs-config.sh
    
    log "Next.js configuration check complete!"
}

# Main execution
main() {
    # Check SSH connection first
    check_ssh_connection
    
    # Fix Nginx configuration
    fix_nginx_config
    
    # Check Next.js configuration
    check_nextjs_config
    
    # Create a custom CSS file
    create_custom_css
    
    # Create a test HTML file
    create_test_html
    
    log "CSS fix complete! Please check the following URLs:"
    log "- https://beta.hawkhire.ai/test.html (Test page with Next.js CSS)"
    log "- https://beta.hawkhire.ai/test2.html (Test page with inline CSS)"
    log "- https://beta.hawkhire.ai/test3.html (Test page with custom CSS)"
}

# Run the main function
main "$@" 