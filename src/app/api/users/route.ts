
import { NextResponse } from 'next/server';
import { getConnectionPool, sql } from '@/lib/db';
import type { User } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// GET all users
export async function GET(request: Request) {
  try {
    const pool = await getConnectionPool();
    const result = await pool.request().query('SELECT id, username, role, branchId, balance, stationName FROM Users');
    return NextResponse.json({ users: result.recordset });
  } catch (error: any) {
    if(error.number === 208) { // Table does not exist
      return NextResponse.json({ users: [] });
    }
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ message: 'Failed to fetch users', error: error.message }, { status: 500 });
  }
}

// POST a new user
export async function POST(request: Request) {
  const { user: newUser } = await request.json();
  const { id, username, password, role, branchId, stationName } = newUser;
  
  if (!username || !password || !role) {
    return NextResponse.json({ message: 'Username, password, and role are required' }, { status: 400 });
  }

  try {
    const pool = await getConnectionPool();

    // Check for existing username
    const existingUser = await pool.request()
      .input('Username', sql.NVarChar, username)
      .query('SELECT id FROM Users WHERE username = @Username');
    
    if (existingUser.recordset.length > 0) {
      return NextResponse.json({ message: `User with username '${username}' already exists.` }, { status: 409 });
    }
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, password) // In a real app, hash this password
      .input('role', sql.NVarChar, role)
      .input('branchId', sql.NVarChar, branchId)
      .input('stationName', sql.NVarChar, stationName)
      .query(`
        INSERT INTO Users (id, username, password, role, branchId, stationName, balance)
        VALUES (@id, @username, @password, @role, @branchId, @stationName, 0)
      `);

    const createdUser: User = { id, username, role, branchId, stationName, balance: 0 };
    return NextResponse.json({ user: createdUser }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ message: 'Failed to create user', error: error.message }, { status: 500 });
  }
}

// PUT (update) a user
export async function PUT(request: Request) {
  const { user: updatedUser } = await request.json();
  const { id, username, password, role, branchId, stationName, balance } = updatedUser;

  if (!id) {
    return NextResponse.json({ message: 'User ID is required for an update' }, { status: 400 });
  }

  try {
    const pool = await getConnectionPool();
    
    let setClauses = [
      'username = @username',
      'role = @role',
      'branchId = @branchId',
      'stationName = @stationName',
      'balance = @balance',
    ];
    if (password) {
      setClauses.push('password = @password');
    }

    const requestToRun = pool.request()
        .input('id', sql.NVarChar, id)
        .input('username', sql.NVarChar, username)
        .input('role', sql.NVarChar, role)
        .input('branchId', sql.NVarChar, branchId)
        .input('stationName', sql.NVarChar, stationName)
        .input('balance', sql.Decimal(18, 2), balance);

    if (password) {
      requestToRun.input('password', sql.NVarChar, password);
    }
    
    await requestToRun.query(`UPDATE Users SET ${setClauses.join(', ')} WHERE id = @id`);

    const returnedUser: User = { id, username, role, branchId, stationName, balance };
    return NextResponse.json({ user: returnedUser });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ message: 'Failed to update user', error: error.message }, { status: 500 });
  }
}

// DELETE a user
export async function DELETE(request: Request) {
    const { id } = await request.json();

    if (!id) {
        return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    try {
        const pool = await getConnectionPool();
        const result = await pool.request()
            .input('id', sql.NVarChar, id)
            .query('SELECT username FROM Users WHERE id = @id');
        
        if (result.recordset.length === 0) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        
        const username = result.recordset[0].username;

        await pool.request()
            .input('id', sql.NVarChar, id)
            .query('DELETE FROM Users WHERE id = @id');

        return NextResponse.json({ message: `User '${username}' deleted successfully.`, id: id, username: username });
    } catch (error: any) {
        console.error('Failed to delete user:', error);
        return NextResponse.json({ message: 'Failed to delete user', error: error.message }, { status: 500 });
    }
}
