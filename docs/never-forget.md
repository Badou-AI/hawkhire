# NEVER FORGET

When working on this codebase, always remember these critical guidelines:

## Code Modification Guidelines

- **YOU ARE STARTING FROM A WORKING CODEBASE** - Always try to use the existing methods before writing new ones
- **DON'T DELETE COMMENTS**
- **DON'T DELETE IMPORTS**
- **Don't delete working code, especially if it has nothing to do with the current task**
- **Don't delete test functions**
- **DON'T MAKE UP NEW IMPORTS** unless you can find it in the codebase

## Networking Guidelines

- **ALWAYS USE IPv4 ADDRESSES** - Use `127.0.0.1` instead of `localhost` or `::1`
- **MAINTAIN CONSISTENT HOST HEADERS** - When using fetch or XHR, ensure host headers match IPv4 addresses
- **DON'T REINTRODUCE IPv6 ISSUES** - Once fixed, IPv4/IPv6 issues should never come back
- **CHECK ALL API ENDPOINTS** - Ensure all endpoints use consistent addressing

## Why These Matter

1. **Existing Methods**: The codebase has been built with careful consideration. Existing methods often handle edge cases and scenarios you might not immediately consider.

2. **Comments**: They contain valuable context and explanations that might not be immediately obvious from the code alone.

3. **Imports**: Existing imports are there for a reason. Removing them can break functionality in non-obvious ways.

4. **Working Code**: If code is working, especially if it's unrelated to your task, leave it alone. You might not know all the places that depend on it.

5. **Test Functions**: Tests are crucial for maintaining code quality and preventing regressions. Never remove them without explicit direction.

6. **New Imports**: Adding imports that don't exist in the codebase can lead to dependency conflicts and maintenance issues.

7. **IPv4/IPv6 Consistency**: Network issues can be subtle and hard to debug. Once fixed, they should stay fixed.

Remember: When in doubt, preserve existing functionality. Your changes should add value without disrupting what already works. 

## IMPORTANT

- before starting any task, output the string "Bismillah..."
