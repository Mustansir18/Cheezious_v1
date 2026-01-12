
import { NextResponse } from 'next/server';
import { initialDeals } from '@/lib/data';

/**
 * Handles GET requests to /api/deals.
 * This is a placeholder and should be replaced with logic to fetch deals from a database.
 */
export async function GET(request: Request) {
  // In a real application, you would fetch this data from your SQL database.
  const dealsData = {
    deals: initialDeals
  };

  return NextResponse.json(dealsData);
}
