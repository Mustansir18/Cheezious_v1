
import { NextResponse } from 'next/server';
import { getConnectionPool, sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    console.log('[DB-TEST] Attempting to get database connection pool...');
    const pool = await getConnectionPool();
    console.log('[DB-TEST] Connection pool retrieved. Pinging database...');
    
    // A simple query to verify the connection is active and can execute commands.
    await pool.request().query('SELECT 1');
    console.log('[DB-TEST] Database ping successful.');

    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful!',
    });

  } catch (error: any) {
    console.error('[DB-TEST] Database connection test failed:', error);
    
    // Return a detailed error response
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed.',
      error: {
        name: error.name,
        code: error.code,
        message: error.message,
      },
      env_vars: {
        DB_USER: process.env.DB_USER ? 'loaded' : 'missing',
        DB_PASSWORD: process.env.DB_PASSWORD ? 'loaded' : 'missing',
        DB_SERVER: process.env.DB_SERVER ? 'loaded' : 'missing',
        DB_NAME: process.env.DB_NAME ? 'loaded' : 'missing',
        DB_PORT: process.env.DB_PORT ? 'loaded' : 'missing',
      }
    }, { status: 500 });
  }
}
