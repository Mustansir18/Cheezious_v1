
import { NextResponse } from 'next/server';
import { getConnectionPool, sql } from '@/lib/db';
import type { CashierLogEntry } from '@/lib/types';


export async function GET(request: Request) {
  try {
    const pool = await getConnectionPool();
    const result = await pool.request().query('SELECT * FROM CashierLog ORDER BY timestamp DESC');
    return NextResponse.json({ logs: result.recordset });
  } catch (error: any) {
    console.error('Failed to fetch cashier logs:', error);
    return NextResponse.json({ message: 'Failed to fetch cashier logs', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const logEntry: Omit<CashierLogEntry, 'id' | 'timestamp'> = await request.json();
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    const pool = await getConnectionPool();
    
    // Start a transaction to ensure both log and user balance are updated
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        // Insert into CashierLog
        await transaction.request()
            .input('id', sql.NVarChar, id)
            .input('timestamp', sql.DateTime, timestamp)
            .input('type', sql.NVarChar, logEntry.type)
            .input('amount', sql.Decimal(18, 2), logEntry.amount)
            .input('cashierId', sql.NVarChar, logEntry.cashierId)
            .input('cashierName', sql.NVarChar, logEntry.cashierName)
            .input('adminId', sql.NVarChar, logEntry.adminId)
            .input('adminName', sql.NVarChar, logEntry.adminName)
            .input('notes', sql.NVarChar, logEntry.notes)
            .query(`
                INSERT INTO CashierLog (id, timestamp, type, amount, cashierId, cashierName, adminId, adminName, notes)
                VALUES (@id, @timestamp, @type, @amount, @cashierId, @cashierName, @adminId, @adminName, @notes)
            `);
            
        // Update user's balance
        const operation = logEntry.type === 'deposit' ? '+' : '-';
        await transaction.request()
            .input('userId', sql.NVarChar, logEntry.cashierId)
            .input('amount', sql.Decimal(18, 2), logEntry.amount)
            .query(`UPDATE Users SET balance = balance ${operation} @amount WHERE id = @userId`);
        
        await transaction.commit();

        const savedLog = { id, timestamp, ...logEntry };
        return NextResponse.json(savedLog, { status: 201 });

    } catch(err) {
        await transaction.rollback();
        throw err; // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    console.error('Failed to create cashier log:', error);
    return NextResponse.json({ message: 'Failed to create cashier log', error: error.message }, { status: 500 });
  }
}
