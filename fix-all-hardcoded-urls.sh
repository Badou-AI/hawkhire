#!/bin/bash

# Script to find and fix all hardcoded localhost URLs in the codebase
echo "🔍 Scanning codebase for hardcoded localhost URLs..."

# Create patches directory if it doesn't exist
mkdir -p patches

# 1. Fix CORS configuration in main.py
echo "📝 Creating patch for CORS configuration in backend/app/main.py..."
cat > patches/fix-cors-origins.patch << 'EOF'
--- a/backend/app/main.py
+++ b/backend/app/main.py
@@ -57,14 +57,25 @@
 )
 
 # Configure CORS
+def get_cors_origins():
+    """Get CORS origins from environment variables."""
+    # Default frontend URL
+    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
+    # Additional CORS origins from environment variable
+    additional_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,https://hawkhire.com,https://beta.hawkhire.com")
+    # Combine into a list
+    all_origins = [frontend_url]
+    all_origins.extend(additional_origins.split(","))
+    # Return unique origins
+    return list(set(all_origins))
+
+# Configure CORS with dynamic origins
 app.add_middleware(
     CORSMiddleware,
-    allow_origins=[
-        "http://localhost:3000", 
-        "http://127.0.0.1:3000", 
-        "https://hawkhire.com", 
-        "https://beta.hawkhire.com",
-        FRONTEND_URL
-    ],
+    allow_origins=get_cors_origins(),
     allow_credentials=True,
     allow_methods=["*"],
     allow_headers=["*"],
 )
EOF

# 2. Fix hardcoded API URL in job-board actions.ts
echo "📝 Creating patch for hardcoded API URL in app/(protected)/job-board/[id]/actions.ts..."
cat > patches/fix-job-board-actions.patch << 'EOF'
--- a/app/(protected)/job-board/[id]/actions.ts
+++ b/app/(protected)/job-board/[id]/actions.ts
@@ -3,9 +3,8 @@
       if (!jobId) {
         throw new Error('Job ID is required')
       }
-      // Use absolute URL with IPv4 address
-      const response = await fetch(`http://127.0.0.1:${process.env.PORT || 3000}/api/jobs`, {
-        headers: {
-          'Host': '127.0.0.1'
-        }
+      // Use environment variables for API URL or fallback to relative path
+      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
+      const response = await fetch(`${baseUrl}/api/jobs`, {
+        // No need for Host header when using relative or environment-based URLs
       })
EOF

# 3. Fix API URL fallbacks in API routes
echo "📝 Creating patch for API URL fallbacks in app/api/analyze-resume/route.ts..."
cat > patches/fix-analyze-resume-route.patch << 'EOF'
--- a/app/api/analyze-resume/route.ts
+++ b/app/api/analyze-resume/route.ts
@@ -1,5 +1,6 @@
 // Use environment variable for API URL with fallback to local address
-const API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8080';
+const isDev = process.env.NODE_ENV === 'development';
+const API_URL = process.env.PYTHON_API_URL || (isDev ? 'http://127.0.0.1:8080' : '/api');
EOF

# 4. Find all other files with similar patterns - generate patches dynamically
echo "🔍 Scanning for other files with hardcoded localhost references..."

# Create a temporary directory for generated patches
mkdir -p patches/tmp

# Find files with localhost or 127.0.0.1 references
HARDCODED_FILES=$(grep -l -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" "127.0.0.1\|localhost" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git)

for file in $HARDCODED_FILES; do
    if [[ "$file" != "backend/app/main.py" && "$file" != "app/(protected)/job-board/[id]/actions.ts" && "$file" != "app/api/analyze-resume/route.ts" ]]; then
        echo "📄 Found hardcoded URL in $file"
        # Check file extension
        if [[ "$file" == *.ts || "$file" == *.tsx || "$file" == *.js || "$file" == *.jsx ]]; then
            # Create a patch for TypeScript/JavaScript files
            PATCH_FILE="patches/tmp/fix-$(echo $file | tr '/' '-' | tr '.' '-').patch"
            
            # Create sed script to replace hardcoded URLs
            # Pattern 1: const API_URL = process.env.SOMETHING || 'http://127.0.0.1:XXXX';
            sed -E "s|(const|let|var)([[:space:]]+)([a-zA-Z_]+)([[:space:]]*=)([[:space:]]*)process\.env\.([a-zA-Z_]+)([[:space:]]*\|\|)([[:space:]]*)('http:\/\/127\.0\.0\.1:[0-9]+\'|\"http:\/\/127\.0\.0\.1:[0-9]+\"|'http:\/\/localhost:[0-9]+\'|\"http:\/\/localhost:[0-9]+\");|\1\2\3\4\5process.env.\6 || (process.env.NODE_ENV === 'development' ? \8\9 : '/api');|g" "$file" > "$file.tmp"
            
            # Pattern 2: const response = await fetch('http://127.0.0.1:XXXX/something')
            sed -E "s|fetch\(('http:\/\/127\.0\.0\.1:[0-9]+\/|\"http:\/\/127\.0\.0\.1:[0-9]+\/|'http:\/\/localhost:[0-9]+\/|\"http:\/\/localhost:[0-9]+\/)|fetch\((process.env.NODE_ENV === 'development' ? \1 : '/|g" "$file.tmp" > "$file.tmp2"
            
            # Pattern 3: fetch(`http://127.0.0.1:${port}/something`)
            sed -E "s|fetch\(\`http:\/\/(127\.0\.0\.1|localhost):(.*?)\/|fetch\(\`\${process.env.NODE_ENV === 'development' ? 'http://\1:\2/' : '/|g" "$file.tmp2" > "$file.tmp3"
            
            # Create a patch file
            diff -u "$file" "$file.tmp3" > "$PATCH_FILE" || true
            
            # Clean up temporary files
            rm "$file.tmp" "$file.tmp2" "$file.tmp3"
            
            # If patch is not empty, add to the list
            if [ -s "$PATCH_FILE" ]; then
                echo "✅ Created patch for $file"
            else
                echo "❌ Failed to create patch for $file"
                rm "$PATCH_FILE"
            fi
        elif [[ "$file" == *.py ]]; then
            # Create a patch for Python files
            PATCH_FILE="patches/tmp/fix-$(echo $file | tr '/' '-' | tr '.' '-').patch"
            
            # Create sed script for Python files
            sed -E "s|os\.getenv\(\"([A-Z_]+)\", \"http:\/\/(127\.0\.0\.1|localhost):[0-9]+\"\)|os.getenv(\"\1\", \"http://127.0.0.1:8080\" if os.getenv(\"ENVIRONMENT\") == \"development\" else \"/api\")|g" "$file" > "$file.tmp"
            
            # Create a patch file
            diff -u "$file" "$file.tmp" > "$PATCH_FILE" || true
            
            # Clean up temporary file
            rm "$file.tmp"
            
            # If patch is not empty, add to the list
            if [ -s "$PATCH_FILE" ]; then
                echo "✅ Created patch for $file"
            else
                echo "❌ Failed to create patch for $file"
                rm "$PATCH_FILE"
            fi
        fi
    fi
done

# Consolidate all temporary patches into a single patch file
echo "📦 Consolidating all patches into fix-all-hardcoded-urls.patch..."
cat patches/fix-cors-origins.patch patches/fix-job-board-actions.patch patches/fix-analyze-resume-route.patch patches/tmp/*.patch > patches/fix-all-hardcoded-urls.patch 2>/dev/null || true

# Clean up
rm -rf patches/tmp

# Apply the patches
echo "🔧 Applying patches to fix hardcoded URLs..."

# Check if patch command is available
if ! command -v patch &> /dev/null; then
    echo "❌ Error: 'patch' command not found. Please install it and try again."
    exit 1
fi

# First, test if patches can be applied
echo "🧪 Testing if patches can be applied..."
if patch --dry-run -p0 < patches/fix-all-hardcoded-urls.patch &> /dev/null; then
    echo "✅ Patches can be applied cleanly."
    # Apply the patches
    patch -p0 < patches/fix-all-hardcoded-urls.patch
    echo "✅ All patches applied successfully!"
else
    echo "⚠️ Some patches could not be applied cleanly."
    echo "   Please review patches/fix-all-hardcoded-urls.patch and apply manually."
    
    # Try to apply individual patches
    echo "🔄 Trying to apply individual patches..."
    
    if patch --dry-run -p0 < patches/fix-cors-origins.patch &> /dev/null; then
        patch -p0 < patches/fix-cors-origins.patch && echo "✅ Applied CORS origins patch"
    else
        echo "⚠️ CORS origins patch could not be applied"
    fi
    
    if patch --dry-run -p0 < patches/fix-job-board-actions.patch &> /dev/null; then
        patch -p0 < patches/fix-job-board-actions.patch && echo "✅ Applied job board actions patch"
    else
        echo "⚠️ Job board actions patch could not be applied"
    fi
    
    if patch --dry-run -p0 < patches/fix-analyze-resume-route.patch &> /dev/null; then
        patch -p0 < patches/fix-analyze-resume-route.patch && echo "✅ Applied analyze resume route patch"
    else
        echo "⚠️ Analyze resume route patch could not be applied"
    fi
fi

echo "🔄 Adding the environment variables to deployment configuration files..."

# Update backend/.env.example to include CORS_ORIGINS if not already present
if ! grep -q "CORS_ORIGINS" backend/.env.example; then
    echo -e "\n# CORS configuration\nCORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://hawkhire.com,https://beta.hawkhire.com" >> backend/.env.example
    echo "✅ Added CORS_ORIGINS to backend/.env.example"
fi

# Update backend/.env.production to include CORS_ORIGINS if not already present
if ! grep -q "CORS_ORIGINS" backend/.env.production; then
    echo -e "\n# CORS configuration\nCORS_ORIGINS=https://beta.hawkhire.ai,https://hawkhire.ai,https://www.hawkhire.ai" >> backend/.env.production
    echo "✅ Added CORS_ORIGINS to backend/.env.production"
fi

echo "
🎉 All done! 🎉

Here's what we did:
1. Created patches to fix hardcoded localhost URLs
2. Applied patches where possible
3. Added necessary environment variables to config files

Next steps:
1. Review any patches that couldn't be applied automatically
2. Check your code to ensure all hardcoded URLs are fixed
3. Make sure environment variables are set correctly in your deployment environment

Remember: Always use environment variables or environment-aware fallbacks for URLs!
" 