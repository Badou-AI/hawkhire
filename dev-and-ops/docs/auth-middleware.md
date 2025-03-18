# Authentication & Middleware Best Practices

## Critical Performance Issues to Avoid

### 🚫 Rate Limiting Prevention

The middleware is a critical path that runs on every matched request. Improper implementation can lead to severe performance issues and rate limiting from Supabase.

#### Common Pitfalls

1. **Excessive Session Checks**
   - ❌ Checking session on every request
   - ✅ Only check sessions for protected routes
   ```typescript
   // Good: Only check protected routes
   if (request.nextUrl.pathname.startsWith('/(protected)')) {
     const { data: { session } } = await supabase.auth.getSession()
   }
   ```

2. **Auto Token Refresh**
   - ❌ Enabling `autoRefreshToken` in middleware
   - ✅ Disable auto refresh in middleware
   ```typescript
   auth: {
     autoRefreshToken: false // Prevent excessive refresh requests
   }
   ```

3. **Debug Logging**
   - ❌ Excessive console logging in middleware
   - ✅ Use logging only when debugging specific issues

### Best Practices

1. **Middleware Configuration**
   ```typescript
   export const config = {
     matcher: [
       '/(protected)/:path*',
       '/api/v1/:path*',
       '/sign-in',
       '/sign-up',
       '/auth/callback',
     ],
   }
   ```

2. **Cookie Handling**
   - Use consistent cookie settings
   - Always set `path` and `sameSite`
   ```typescript
   cookies.set({
     name,
     value,
     path: '/',
     sameSite: 'lax'
   })
   ```

3. **JWT Usage**
   - ❌ Don't use JWT for temporary IDs or non-auth purposes
   - ✅ Use UUID v4 for generating unique IDs
   ```typescript
   // Bad: Using JWT for temporary IDs
   const tempId = sign({ /* data */ }, 'secret')

   // Good: Using UUID for temporary IDs
   import { randomUUID } from 'crypto'
   const tempId = randomUUID()
   ```
   Common errors like `InvalidJWTToken: Invalid value for JWT claim "exp"` often indicate JWT is being used for non-auth purposes.
   Keep JWT usage strictly for authentication and authorization.

4. **Error Handling**
   - Clear invalid sessions
   - Redirect to sign-in with error context
   - Return appropriate status codes for API routes

### Rate Limiting

If you encounter rate limiting from Supabase:
1. Check middleware implementation
2. Review auth configuration
3. Disable debug logging in production
4. Consider implementing request caching
5. Monitor request patterns in development

### API Endpoint Conventions

1. **PDF Processing Endpoints**
   - ❌ Don't use local endpoints for PDF processing
   - ✅ Use remote semantic service endpoints
   ```typescript
   // Remote service configuration
   const REMOTE_API_URL = process.env.NEXT_PUBLIC_API_URL  // Points to remote service
   
   // PDF to Text conversion
   const formData = new FormData()
   formData.append('file', pdfFile)
   fetch(`${REMOTE_API_URL}/v1/tools/convert_pdf2text`, {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${session.access_token}`
     },
     body: formData
   })
   ```

2. **Service Architecture**
   - Local FastAPI server (`:8080`) - Job management, auth, etc.
   - Remote FastAPI server (`:8000`) - Semantic service, PDF processing, LLM
   ```typescript
   // Local API (8080)
   /v1/jobs/*          // Job management
   /v1/organizations/* // Organization management
   
   // Remote API (8000)
   /v1/tools/convert_pdf2text  // PDF processing
   /v1/tools/convert_doc2json  // Document parsing
   /v1/tools/extract_job_data  // Job data extraction
   ```

3. **Service Configuration**

1. **Port Configuration**
   ```env
   # .env.local
   
   # Local API (job management, auth, proxy to remote services)
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8080
   ```

2. **Port Conventions**
   - `:8080` - Local FastAPI server (job management, auth, proxy to remote services)
   - `:3000` - Next.js development server
   ```bash
   # Start servers with correct ports
   $ uvicorn main:app --port 8080  # Local API
   ```

3. **404 Troubleshooting**
   - Verify Local API: `curl http://127.0.0.1:8080/health`
   - Check correct port usage in .env.local
   - Test all endpoints against port 8080 (local API will proxy to remote services as needed)

### File Upload Patterns

4. **File Upload Patterns**
   - Always include `Authorization` header with access token
   - Use FormData for file uploads
   - Handle remote service errors gracefully
   ```typescript
   try {
     const response = await fetch(url, {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${session.access_token}`
       },
       body: formData
     })
     
     if (!response.ok) {
       const errorData = await response.text()
       if (response.status === 404) {
         console.error('Remote service endpoint not found:', url)
         throw new Error('PDF processing service unavailable')
       }
       throw new Error(`Service error: ${response.status} ${errorData}`)
     }
   } catch (error) {
     console.error('Processing error:', error)
     // Handle both network and service errors
   }
   ```

### Development Guidelines

1. **Testing Changes**
   - Always test middleware changes in development first
   - Monitor network requests for excessive calls
   - Watch for repeated auth operations

2. **Deployment**
   - Gradually roll out middleware changes
   - Monitor error rates and performance metrics
   - Have rollback plan ready

Remember: The middleware runs on EVERY matched request. Each optimization here has a multiplicative effect on performance. 