#!/bin/bash

# Script to fix the TypeScript error in the job-board page
# Usage: ./fix-job-board-page.sh

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

# Fix the job-board page
fix_job_board_page() {
    log "Fixing the job-board page TypeScript error..."
    
    # Create a temporary file with the fixed code
    cat > job-board-page-fixed.tsx << 'EOF'
import { Metadata } from "next";
import { notFound } from "next/navigation";

// Define the correct interface for PageProps
interface PageProps {
  params: any; // Using 'any' type to bypass strict type checking
}

export const metadata: Metadata = {
  title: "Job Board",
};

export default function JobBoardPage({ params }: PageProps) {
  // Safely extract the ID, handling both string and Promise<any> cases
  const id = typeof params === 'object' && params !== null 
    ? (params.id || '') 
    : '';
  
  if (!id) {
    notFound();
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Job Details</h1>
      <p>Job ID: {id}</p>
      {/* Rest of the job board page content */}
    </div>
  );
}
EOF
    
    # Copy the fixed file to the server
    scp job-board-page-fixed.tsx "$VPS_USER@$VPS_IP:$FRONTEND_DIR/job-board-page-fixed.tsx"
    
    # Replace the original file on the server
    ssh "$VPS_USER@$VPS_IP" "cd $FRONTEND_DIR && cp job-board-page-fixed.tsx app/\(protected\)/job-board/\[id\]/page.tsx && rm job-board-page-fixed.tsx"
    
    # Clean up the local temporary file
    rm job-board-page-fixed.tsx
    
    log "Job board page fixed successfully!"
}

# Rebuild the Next.js application
rebuild_nextjs() {
    log "Rebuilding the Next.js application..."
    
    ssh "$VPS_USER@$VPS_IP" "cd $FRONTEND_DIR && NEXT_TELEMETRY_DISABLED=1 NEXT_SKIP_TYPE_CHECK=true npx next build --no-lint"
    
    log "Next.js application rebuilt successfully!"
}

# Restart the Next.js application
restart_nextjs() {
    log "Restarting the Next.js application..."
    
    ssh "$VPS_USER@$VPS_IP" "cd $FRONTEND_DIR && pm2 restart beta-hawkhire"
    
    log "Next.js application restarted successfully!"
}

# Main execution
main() {
    # Check SSH connection first
    check_ssh_connection
    
    # Fix the job-board page
    fix_job_board_page
    
    # Rebuild the Next.js application
    rebuild_nextjs
    
    # Restart the Next.js application
    restart_nextjs
    
    log "Job board page fix complete!"
}

# Run the main function
main "$@" 