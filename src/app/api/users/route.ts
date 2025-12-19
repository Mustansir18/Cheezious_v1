import { NextResponse } from 'next/server';

/**
 * Handles GET requests to /api/users.
 * This is a placeholder and should be replaced with logic to fetch users from a database.
 */
export async function GET(request: Request) {
  // In a real application, you would fetch user data from your SQL database here.
  const users = [
    { id: 1, name: 'Admin User', role: 'admin' },
    { id: 2, name: 'Cashier User', role: 'cashier' },
  ];

  return NextResponse.json({ users });
}
