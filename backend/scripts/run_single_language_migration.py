#!/usr/bin/env python3
"""
Script to run the single language migration.
This script will:
1. Create a backup of the database
2. Run the migration SQL script
3. Verify the migration was successful
"""

import os
import sys
import subprocess
import logging
from pathlib import Path
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(f"migration_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
    ]
)
logger = logging.getLogger(__name__)

# Get the project root directory
project_root = Path(__file__).parent.parent

# Path to the migration SQL script
migration_script_path = project_root / "migrations" / "single_language_migration.sql"

# Supabase connection details (from environment variables)
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SUPABASE_DB_URL = os.environ.get("SUPABASE_DB_URL")

def check_prerequisites():
    """Check if all prerequisites are met."""
    logger.info("Checking prerequisites...")
    
    if not migration_script_path.exists():
        logger.error(f"Migration script not found at {migration_script_path}")
        return False
    
    if not SUPABASE_URL or not SUPABASE_KEY or not SUPABASE_DB_URL:
        logger.error("Missing required environment variables: SUPABASE_URL, SUPABASE_KEY, SUPABASE_DB_URL")
        return False
    
    # Check if pg_dump and psql are available
    try:
        subprocess.run(["pg_dump", "--version"], check=True, capture_output=True)
        subprocess.run(["psql", "--version"], check=True, capture_output=True)
    except (subprocess.SubprocessError, FileNotFoundError):
        logger.error("pg_dump or psql not found. Please install PostgreSQL client tools.")
        return False
    
    return True

def create_backup():
    """Create a backup of the database."""
    logger.info("Creating database backup...")
    
    backup_file = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
    backup_path = project_root / "migrations" / "backups" / backup_file
    
    # Create backups directory if it doesn't exist
    backup_path.parent.mkdir(exist_ok=True)
    
    try:
        # Run pg_dump to create a backup
        cmd = [
            "pg_dump",
            "-d", SUPABASE_DB_URL,
            "-f", str(backup_path),
            "--no-owner",
            "--no-acl"
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        logger.info(f"Backup created successfully at {backup_path}")
        return True
    except subprocess.SubprocessError as e:
        logger.error(f"Failed to create backup: {e}")
        return False

def run_migration():
    """Run the migration SQL script."""
    logger.info("Running migration script...")
    
    try:
        # Run the migration script using psql
        cmd = [
            "psql",
            "-d", SUPABASE_DB_URL,
            "-f", str(migration_script_path)
        ]
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        logger.info("Migration script executed successfully")
        logger.debug(f"Migration output: {result.stdout}")
        return True
    except subprocess.SubprocessError as e:
        logger.error(f"Failed to run migration: {e}")
        logger.error(f"Error output: {e.stderr if hasattr(e, 'stderr') else ''}")
        return False

def verify_migration():
    """Verify the migration was successful."""
    logger.info("Verifying migration...")
    
    try:
        # Check if the pg_trgm extension is enabled
        cmd = [
            "psql",
            "-d", SUPABASE_DB_URL,
            "-c", "SELECT * FROM pg_extension WHERE extname = 'pg_trgm';"
        ]
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        
        if "pg_trgm" not in result.stdout:
            logger.error("Migration verification failed: pg_trgm extension not enabled")
            return False
        
        # Check if the language column exists in the jobs table
        cmd = [
            "psql",
            "-d", SUPABASE_DB_URL,
            "-c", "SELECT column_name FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'language';"
        ]
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        
        if "language" not in result.stdout:
            logger.error("Migration verification failed: language column not found in jobs table")
            return False
        
        # Check if the indexes were created
        cmd = [
            "psql",
            "-d", SUPABASE_DB_URL,
            "-c", "SELECT indexname FROM pg_indexes WHERE tablename = 'jobs' AND indexname LIKE 'idx_jobs_%';"
        ]
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        
        if "idx_jobs_language" not in result.stdout:
            logger.warning("Migration verification warning: idx_jobs_language index not found")
        
        logger.info("Migration verification successful")
        return True
    except subprocess.SubprocessError as e:
        logger.error(f"Failed to verify migration: {e}")
        return False

def main():
    """Main function to run the migration."""
    logger.info("Starting single language migration...")
    
    if not check_prerequisites():
        logger.error("Prerequisites check failed. Aborting migration.")
        return 1
    
    if not create_backup():
        logger.error("Backup creation failed. Aborting migration.")
        return 1
    
    if not run_migration():
        logger.error("Migration failed. Please restore from backup.")
        return 1
    
    if not verify_migration():
        logger.error("Migration verification failed. Please check the database and restore from backup if necessary.")
        return 1
    
    logger.info("Migration completed successfully!")
    return 0

if __name__ == "__main__":
    sys.exit(main()) 