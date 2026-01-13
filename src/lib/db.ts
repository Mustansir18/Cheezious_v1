
/**
 * @fileoverview This file establishes and exports a reusable connection pool to a SQL Server database.
 * It reads configuration from environment variables for security.
 * The connection pool is implemented as a singleton to ensure it's created only once.
 */

import sql from 'mssql';

const dbConfig: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
  options: {
    encrypt: process.env.NODE_ENV === 'production',
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool: sql.ConnectionPool | null = null;
let poolConnectPromise: Promise<sql.ConnectionPool> | null = null;

export async function getConnectionPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }

  if (poolConnectPromise) {
    return poolConnectPromise;
  }

  poolConnectPromise = new Promise(async (resolve, reject) => {
    try {
      console.log('[db] Creating new database connection pool...');
      const newPool = new sql.ConnectionPool(dbConfig);
      await newPool.connect();
      console.log('[db] Database connection pool established.');
      pool = newPool;
      resolve(pool);
    } catch (err) {
      console.error('[db] Database connection failed:', err);
      pool = null;
      poolConnectPromise = null;
      reject(err);
    }
  });

  return poolConnectPromise;
}

export { sql };
