
import { NextResponse } from 'next/server';
import { getConnectionPool, sql } from '@/lib/db';
import type { Rating } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// GET all ratings
export async function GET(request: Request) {
  try {
    const pool = await getConnectionPool();
    const result = await pool.request().query('SELECT * FROM Ratings ORDER BY timestamp DESC');
    return NextResponse.json({ ratings: result.recordset });
  } catch (error: any) {
    if(error.number === 208) { // Table not found
      return NextResponse.json({ ratings: [] });
    }
    console.error('Failed to fetch ratings:', error);
    return NextResponse.json({ message: 'Failed to fetch ratings', error: error.message }, { status: 500 });
  }
}

// POST a new rating
export async function POST(request: Request) {
  const body: Omit<Rating, 'id' | 'timestamp'> = await request.json();
  const { rating, comment } = body;

  if (!rating) {
    return NextResponse.json({ message: 'Rating value is required' }, { status: 400 });
  }
  
  const newRating: Rating = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    rating,
    comment,
  };

  try {
    const pool = await getConnectionPool();
    await pool.request()
      .input('id', sql.NVarChar, newRating.id)
      .input('timestamp', sql.DateTime, new Date(newRating.timestamp))
      .input('rating', sql.Int, newRating.rating)
      .input('comment', sql.NVarChar, newRating.comment)
      .query('INSERT INTO Ratings (id, timestamp, rating, comment) VALUES (@id, @timestamp, @rating, @comment)');

    return NextResponse.json(newRating, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create rating:', error);
    return NextResponse.json({ message: 'Failed to create rating', error: error.message }, { status: 500 });
  }
}

// DELETE all ratings
export async function DELETE(request: Request) {
    try {
        const pool = await getConnectionPool();
        await pool.request().query('DELETE FROM Ratings');
        return NextResponse.json({ message: 'All ratings cleared successfully.' });
    } catch (error: any) {
        console.error('Failed to clear ratings:', error);
        return NextResponse.json({ message: 'Failed to clear ratings', error: error.message }, { status: 500 });
    }
}
