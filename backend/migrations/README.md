# Single Language Migration

This directory contains the migration scripts to convert the job data from a multilingual model to a single-language model.

## Migration Overview

The migration process involves the following steps:

1. Create a backup of the database
2. Run the migration SQL script
3. Verify the migration was successful

## Migration Files

- `single_language_migration.sql`: The SQL script that performs the migration
- `fix_indexes.sql`: A SQL script to fix indexes if they failed to create during the migration
- `../scripts/run_single_language_migration.py`: A Python script to automate the migration process

## Migration Details

The migration script performs the following changes:

1. Adds a `language` column to the jobs table
2. Adds a `summary` column to the jobs table
3. Creates temporary columns for the transition
4. Migrates existing data (extracts content by language)
5. Duplicates jobs with French content as separate records
6. Drops the JSONB columns
7. Renames the new columns to the original names
8. Adds indexes for improved performance

## Running the Migration

### Prerequisites

- PostgreSQL client tools (psql, pg_dump)
- Supabase connection details (URL, API key, DB URL)
- PostgreSQL `pg_trgm` extension (for optimal text search indexes)

### Extension Requirements

The migration script attempts to create trigram indexes for improved text search performance. This requires the `pg_trgm` extension to be enabled in your PostgreSQL database.

If you have admin privileges on your Supabase database, the script will try to enable the extension automatically. If not, it will fall back to basic indexes.

To manually enable the extension (if you have admin privileges):

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Note: In some Supabase plans, you might not have permission to create extensions. In this case, the script will automatically use fallback indexes.

### Steps

1. Set the required environment variables:

```bash
export SUPABASE_URL=your_supabase_url
export SUPABASE_KEY=your_supabase_key
export SUPABASE_DB_URL=your_supabase_db_url
```

2. Run the migration script:

```bash
cd backend
python scripts/run_single_language_migration.py
```

3. Check the logs for any errors

### Rollback

If the migration fails, you can restore from the backup created during the migration process:

```bash
psql -d $SUPABASE_DB_URL -f migrations/backups/backup_YYYYMMDD_HHMMSS.sql
```

## Post-Migration Tasks

After the migration is complete, you should:

1. Update the backend models to use the new single-language structure
2. Update the API endpoints to handle the new structure
3. Update the frontend components to display the single-language content

## Verification

To verify the migration was successful, you can:

1. Check if the `language` column exists in the jobs table
2. Check if the jobs data is correctly migrated
3. Test the API endpoints to ensure they return the correct data
4. Test the frontend components to ensure they display the correct data

## Troubleshooting

### Error: operator class "gin_trgm_ops" does not exist for access method "gin"

This error occurs when the `pg_trgm` extension is not enabled in your PostgreSQL database. The updated migration script handles this automatically by:

1. Attempting to create the extension
2. Checking if the extension exists before creating trigram indexes
3. Falling back to basic indexes if the extension is not available

If you're running the migration manually and encounter this error, you can:

1. Enable the extension if you have admin privileges:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```

2. Or use the provided fix script:
   ```bash
   psql -d $SUPABASE_DB_URL -f migrations/fix_indexes.sql
   ```

3. Or modify the migration script to use basic indexes instead:
   ```sql
   -- Replace these lines:
   CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON jobs USING gin (title gin_trgm_ops);
   CREATE INDEX IF NOT EXISTS idx_jobs_description_trgm ON jobs USING gin (description gin_trgm_ops);
   
   -- With these lines:
   CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs (title);
   CREATE INDEX IF NOT EXISTS idx_jobs_description ON jobs (description);
   ```

### Error: permission denied to create extension "pg_trgm"

This error occurs when your database user doesn't have permission to create extensions. In this case:

1. Contact your Supabase administrator to enable the extension
2. Or use the fallback indexes as described above

### Other Issues

If you encounter other issues during the migration:

1. Check the migration logs for specific error messages
2. Restore from the backup if necessary
3. Try running the migration steps manually to identify the specific issue 