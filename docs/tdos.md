

Bismillah...

Let me break down what we need to do and ask some clarifying questions:

1. Data Model Adjustments:
   - Convert string IDs to UUIDs
   - Convert single-language fields to multilingual (en/fr) format:
     * title
     * description
     * location (needs to be split into city/state/country/postal_code)
   - Convert `type` to match our `JobType` enum
   - Add missing fields from our schema:
     * organization_id (UUID)
     * requirements (multilingual)
     * status
     * skills (already exists but needs to be uppercase constants)
     * mock_batch_id

2. Content Questions:
   - Should we auto-generate French translations for all content or would you prefer to handle translations differently?
   - For the organization_id, should we:
     a) Create organizations first and reference their IDs?
     b) Generate random UUIDs for now?
   - For the status field, should we set all to "PUBLISHED" since they're active listings?

3. Asset Management:
   - I notice the logos are referenced as `/company-logos/company-name.png`
   - Questions about asset handling:
     * Where is the Supabase storage bucket configured?
     * Should we create a specific folder structure in storage?
     * Should we handle image optimization/resizing?
     * Do we need to maintain the original filenames or standardize them?

4. Process Plan:
   1. Create organizations first (if needed)
   2. Transform job data to match schema
   3. Upload company assets to storage
   4. Insert transformed jobs

Would you like me to clarify any of these points? And which aspects should we tackle first?
