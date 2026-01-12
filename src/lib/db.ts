/**
 * @fileoverview This file establishes and exports a reusable connection pool to a SQL Server database.
 * It reads configuration from environment variables for security.
 * In a real production environment, you might add more robust features like connection retry logic.
 */

import sql from 'mssql';

// Define the configuration for the database connection.
// It pulls values from the .env file.
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
  options: {
    encrypt: process.env.NODE_ENV === 'production', // Use encryption for production connections
    trustServerCertificate: true, // Change to true for local dev / self-signed certs
  },
};

/**
 * A global connection pool. By creating it once and exporting it,
 * we can reuse the same pool across all our API routes, which is much more efficient
 * than creating a new connection for every request.
 */
let pool: sql.ConnectionPool;

export async function getConnectionPool() {
  if (pool) {
    return pool;
  }
  try {
    pool = await sql.connect(dbConfig);
    console.log('Database connection pool established.');
    return pool;
  } catch (err) {
    console.error('Database connection failed:', err);
    // In a production app, you might want to throw the error or exit the process
    // throw err;
    // For this app, we'll allow it to continue so the UI can still be explored,
    // but API calls will fail.
    return Promise.reject(err);
  }
}

// Export the sql object itself so we can use its types (e.g., sql.Int, sql.VarChar)
// in our API routes when defining query parameters.
export { sql };
