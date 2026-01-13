
import { NextResponse } from 'next/server';
import { getConnectionPool, sql } from '@/lib/db';
import type { User } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export const revalidate = 0;

const SESSION_DURATION_HOURS = 8;

// Get user session
export async function GET(request: Request) {
    const sessionId = request.headers.get('x-session-id');

    if (!sessionId) {
        return NextResponse.json({ user: null, message: 'No session ID provided' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }

    try {
        const pool = await getConnectionPool();
        const result = await pool.request()
            .input('SessionId', sql.NVarChar, sessionId)
            .query(`
                SELECT u.* FROM Users u
                INNER JOIN Sessions s ON u.id = s.UserId
                WHERE s.Id = @SessionId AND (s.ExpiresAt IS NULL OR s.ExpiresAt > GETUTCDATE())
            `);
        
        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            // Don't send password hash to client
            delete user.password;
            return NextResponse.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
        } else {
            return NextResponse.json({ user: null, message: 'Session not found or expired' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
        }

    } catch (error: any) {
        console.error('[API/SESSION - GET] Error:', error);
         if (error.number === 208) { // Invalid object name 'Users' or 'Sessions'
            return NextResponse.json({ user: null, message: 'Database tables not found. Please run migration.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
        }
        return NextResponse.json({ message: 'Failed to retrieve session', error: error.message }, { status: 500 });
    }
}


// Login - Create a new session
export async function POST(request: Request) {
    const { username, password, guestSessionId } = await request.json();
    console.log(`[API/SESSION - POST] Attempting login for user: '${username}'. Guest session: ${guestSessionId}`);

    if (!username || !password) {
        return NextResponse.json({ message: 'Username and password are required.' }, { status: 400 });
    }

    try {
        const pool = await getConnectionPool();
        const result = await pool.request()
            .input('Username', sql.NVarChar, username)
            .input('Password', sql.NVarChar, password) // In a real app, you'd compare a hash
            .query('SELECT * FROM Users WHERE username = @Username AND password = @Password');

        if (result.recordset.length > 0) {
            const user: User = result.recordset[0];
            console.log(`[API/SESSION - POST] Credentials valid for user ID: ${user.id}`);
            const newSessionId = uuidv4();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            try {
                console.log(`[API/SESSION - POST] Starting transaction to create session ${newSessionId}`);
                // Create a new session for the logged-in user
                await transaction.request()
                    .input('SessionId', sql.NVarChar, newSessionId)
                    .input('UserId', sql.NVarChar, user.id)
                    .input('ExpiresAt', sql.DateTime2, expiresAt)
                    .query('INSERT INTO Sessions (Id, UserId, ExpiresAt) VALUES (@SessionId, @UserId, @ExpiresAt)');
                
                console.log('[API/SESSION - POST] Session created successfully.');
                
                // Simplified Logic: The client will handle re-fetching the cart.
                // The server-side cart migration was causing transaction failures.
                // We no longer try to update the guest cart to a user cart here.
                
                await transaction.commit();
                console.log('[API/SESSION - POST] Transaction committed. Login successful.');

                delete user.password;
                return NextResponse.json({ user, sessionId: newSessionId });

            } catch(err: any) {
                console.error('[API/SESSION - POST] Transaction failed. Rolling back.', err);
                await transaction.rollback();
                throw err;
            }

        } else {
            console.warn(`[API/SESSION - POST] Invalid credentials for user: '${username}'`);
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }
    } catch (error: any) {
        console.error('[API/SESSION - POST] Login failed:', error);
        if (error.number === 208) { // Invalid object name 'Users'
            return NextResponse.json({ message: 'Database not set up. Please run the migration.' }, { status: 500 });
        }
        return NextResponse.json({ message: 'Login failed', error: error.message }, { status: 500 });
    }
}

// Logout - Delete a session
export async function DELETE(request: Request) {
    const sessionId = request.headers.get('x-session-id');

    if (!sessionId) {
        return NextResponse.json({ message: 'No session ID provided' }, { status: 400 });
    }
    
    console.log(`[API/SESSION - DELETE] Logging out session: ${sessionId}`);

    try {
        const pool = await getConnectionPool();
        await pool.request()
            .input('SessionId', sql.NVarChar, sessionId)
            .query('DELETE FROM Sessions WHERE Id = @SessionId');
        
        console.log(`[API/SESSION - DELETE] Session ${sessionId} deleted successfully.`);
        return NextResponse.json({ message: 'Logged out successfully' });

    } catch (error: any) {
        console.error('[API/SESSION - DELETE] Logout failed:', error);
        return NextResponse.json({ message: 'Logout failed', error: error.message }, { status: 500 });
    }
}
