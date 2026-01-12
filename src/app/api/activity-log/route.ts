
import { NextResponse } from 'next/server';
import { getConnectionPool, sql } from '@/lib/db';
import type { ActivityLog } from '@/lib/types';


export async function GET(request: Request) {
  try {
    const pool = await getConnectionPool();
    const result = await pool.request().query('SELECT * FROM ActivityLog ORDER BY timestamp DESC');
    return NextResponse.json({ logs: result.recordset });
  } catch (error: any) {
    console.error('Failed to fetch activity logs:', error);
    return NextResponse.json({ message: 'Failed to fetch activity logs', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const logEntry: Omit<ActivityLog, 'id'> = await request.json();

  try {
    const pool = await getConnectionPool();
    const id = crypto.randomUUID();

    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('timestamp', sql.DateTime, new Date(logEntry.timestamp))
      .input('user', sql.NVarChar, logEntry.user)
      .input('message', sql.NVarChar, logEntry.message)
      .input('category', sql.NVarChar, logEntry.category)
      .query('INSERT INTO ActivityLog (id, timestamp, [user], message, category) VALUES (@id, @timestamp, @user, @message, @category)');

    const savedLog = { id, ...logEntry };
    return NextResponse.json(savedLog, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create activity log:', error);
    return NextResponse.json({ message: 'Failed to create activity log', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    try {
        const pool = await getConnectionPool();
        await pool.request().query('DELETE FROM ActivityLog');
        return NextResponse.json({ message: 'Activity log cleared successfully.' }, { status: 200 });
    } catch (error: any) {
        console.error('Failed to clear activity logs:', error);
        return NextResponse.json({ message: 'Failed to clear activity logs', error: error.message }, { status: 500 });
    }
}
