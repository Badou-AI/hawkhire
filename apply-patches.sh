#!/bin/bash

# Script to apply patches to fix hardcoded values in the HawkHire codebase

# Create patches directory if it doesn't exist
mkdir -p patches

# Check if the patch files exist
if [ ! -f "patches/fix-hardcoded-api-routes.patch" ] || [ ! -f "patches/fix-cors-origins.patch" ]; then
    echo "Patch files not found. Creating them..."
    
    # Create patch file for hardcoded API routes
    cat > patches/fix-hardcoded-api-routes.patch << 'EOF'
--- a/app/(protected)/job-board/[id]/actions.ts
+++ b/app/(protected)/job-board/[id]/actions.ts
@@ -3,8 +3,9 @@
 // Action to update job board
 export async function updateJobBoard(formData: FormData) {
   try {
-        // Use absolute URL with IPv4 address
-       const response = await fetch(`http://127.0.0.1:${process.env.PORT || 3000}/api/jobs`, {
+        // Use environment variables for API URL or default to relative path
+        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
+        const response = await fetch(`${baseUrl}/api/jobs`, {
          headers: {
            'Content-Type': 'application/json',
          },
EOF
    
    # Create patch file for CORS origins
    cat > patches/fix-cors-origins.patch << 'EOF'
--- a/backend/app/main.py
+++ b/backend/app/main.py
@@ -57,12 +57,17 @@
 # CORS middleware
 app.add_middleware(
     CORSMiddleware,
-    allow_origins=[
-        "http://localhost:3000", 
-        "http://127.0.0.1:3000", 
-        "https://hawkhire.com", 
-        os.getenv("FRONTEND_URL", "https://beta.hawkhire.ai")
-    ],
+    allow_origins=get_cors_origins(),
     allow_credentials=True,
     allow_methods=["*"],
     allow_headers=["*"],
 )
+
+def get_cors_origins():
+    """Get CORS origins from environment variables."""
+    # Get default frontend URL
+    frontend_url = os.getenv("FRONTEND_URL", "https://beta.hawkhire.ai")
+    # Get additional CORS origins from environment variable
+    additional_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
+    # Combine into a list
+    return [frontend_url] + additional_origins.split(",")
EOF
    
    echo "Patch files created."
fi

# Apply the patches
echo "Applying patches to fix hardcoded values..."

# Check if patch command is available
if ! command -v patch &> /dev/null; then
    echo "Error: 'patch' command not found. Please install it and try again."
    exit 1
fi

# Apply the patches
if patch -p0 --dry-run < patches/fix-hardcoded-api-routes.patch &> /dev/null; then
    patch -p0 < patches/fix-hardcoded-api-routes.patch && echo "✅ Applied patch for hardcoded API routes"
else
    echo "⚠️ Patch for hardcoded API routes could not be applied cleanly. It might already be applied, or the file has been modified."
fi

if patch -p0 --dry-run < patches/fix-cors-origins.patch &> /dev/null; then
    patch -p0 < patches/fix-cors-origins.patch && echo "✅ Applied patch for CORS origins"
else
    echo "⚠️ Patch for CORS origins could not be applied cleanly. It might already be applied, or the file has been modified."
fi

echo "Done! You may now proceed with deployment."
echo "Remember to update your environment files with the correct values." 