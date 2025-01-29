import { Pool, QueryResult, QueryConfig, QueryResultRow } from 'pg'

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'hawkhire',
})

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string | QueryConfig,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  try {
    const res = await pool.query<T>(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Error executing query', { text, error })
    throw error
  }
}

export async function getClient() {
  const client = await pool.connect()
  const release = client.release.bind(client)

  // Set a timeout of 5 seconds to automatically release the client
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for too long.')
    release()
  }, 5000)

  // Monkey patch the release method to clear the timeout
  client.release = () => {
    clearTimeout(timeout)
    return release()
  }

  return client
}

export default {
  query,
  getClient,
} 