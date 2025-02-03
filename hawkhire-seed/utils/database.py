"""
Database utility module providing connection management and batch operations for Supabase/PostgreSQL.
Handles connection pooling, transaction management, and provides methods for efficient batch insertions
of mock data.
"""

import psycopg2
from psycopg2.extras import execute_values
from contextlib import contextmanager
from typing import List, Dict, Any
from config.settings import DATABASE_URL

class DatabaseManager:
    def __init__(self, connection_string: str = DATABASE_URL):
        self.connection_string = connection_string
        self._conn = None

    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        if self._conn is None:
            self._conn = psycopg2.connect(self.connection_string)
        try:
            yield self._conn
        except Exception as e:
            self._conn.rollback()
            raise e
        else:
            self._conn.commit()

    @contextmanager
    def get_cursor(self):
        """Context manager for database cursors"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                yield cursor
            finally:
                cursor.close()

    def execute_batch(self, query: str, args_list: List[tuple], page_size: int = 100):
        """Execute batch insert operations"""
        with self.get_cursor() as cur:
            execute_values(cur, query, args_list, page_size=page_size)

    def execute_query(self, query: str, params: tuple = None):
        """Execute a single query with parameters"""
        with self.get_cursor() as cur:
            cur.execute(query, params)
            return cur.fetchall()

    def get_mock_data_stats(self):
        """Get statistics about mock data in the database"""
        query = """
        SELECT 
            table_name,
            COUNT(*) as total_records,
            SUM(CASE WHEN is_mock THEN 1 ELSE 0 END) as mock_records
        FROM information_schema.tables t
        LEFT JOIN (
            SELECT 
                'organizations' as table_name, is_mock FROM organizations
            UNION ALL
            SELECT 'jobs', is_mock FROM jobs
            UNION ALL
            SELECT 'resumes', is_mock FROM resumes
        ) mock_data ON t.table_name = mock_data.table_name
        WHERE t.table_schema = 'public'
        AND t.table_name IN ('organizations', 'jobs', 'resumes')
        GROUP BY t.table_name;
        """
        return self.execute_query(query)

    def cleanup_mock_data(self, batch_id: str = None):
        """Remove mock data from all tables"""
        tables = [
            'resumes',
            'jobs',
            'organization_members',
            'organization_verifications',
            'organizations'
        ]
        
        with self.get_cursor() as cur:
            for table in tables:
                if batch_id:
                    cur.execute(
                        f"DELETE FROM {table} WHERE is_mock = true AND mock_batch_id = %s",
                        (batch_id,)
                    )
                else:
                    cur.execute(f"DELETE FROM {table} WHERE is_mock = true")
