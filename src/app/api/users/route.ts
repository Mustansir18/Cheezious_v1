
import { NextResponse } from 'next/server';
import { getConnectionPool, sql } from '@/lib/db';
import type { User } from '@/lib/types';

// GET all users
export async function GET(request: Request) {
  try {
    const pool = await getConnectionPool();
    const result = await pool.request().query('SELECT id, username, role, branchId, balance, stationName FROM Users');
    return NextResponse.json({ users: result.recordset });
  } catch (error: any) {
    if(error.number === 208) { // Table does not exist
      console.warn('Users table not found, returning empty array.');
      return NextResponse.json({ users: [] });
    }
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ message: 'Failed to fetch users', error: error.message }, { status: 500 });
  }
}

// POST a new user
export async function POST(request: Request) {
  const { user: newUser, id } = await request.json();
  const { username, password, role, branchId, stationName } = newUser;
  
  if (!username || !password || !role) {
    return NextResponse.json({ message: 'Username, password, and role are required' }, { status: 400 });
  }
  if (!id) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const pool = await getConnectionPool();

    // Check for existing username OR id
    const existingUser = await pool.request()
      .input('Username', sql.NVarChar, username)
      .input('Id', sql.NVarChar, id)
      .query('SELECT id FROM Users WHERE username = @Username OR id = @Id');
    
    if (existingUser.recordset.length > 0) {
        if (existingUser.recordset[0].id === id) {
             return NextResponse.json({ message: `User with ID '${id}' already exists.` }, { status: 409 });
        }
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
        .input('balance', sql.Decimal(18, 2), balance || 0);

    if (password) {
      requestToRun.input('password', sql.NVarChar, password);
    }
    
    await requestToRun.query(`UPDATE Users SET ${setClauses.join(', ')} WHERE id = @id`);

    const returnedUser: Omit<User, 'password'> = { id, username, role, branchId, stationName, balance: balance || 0 };
    return NextResponse.json({ user: returnedUser });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ message: 'Failed to update user', error: error.message }, { status: 500 });
  }
}

// DELETE a user
export async function DELETE(request: Request) {
    const { id, name } = await request.json();

    if (!id) {
        return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    try {
        const pool = await getConnectionPool();
        await pool.request()
            .input('id', sql.NVarChar, id)
            .query('DELETE FROM Users WHERE id = @id');

        return NextResponse.json({ message: `User '${name}' deleted successfully.`, id: id, username: name });
    } catch (error: any) {
        console.error('Failed to delete user:', error);
        return NextResponse.json({ message: 'Failed to delete user', error: error.message }, { status: 500 });
    }
}
