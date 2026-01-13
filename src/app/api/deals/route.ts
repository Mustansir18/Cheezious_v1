
import { NextResponse } from 'next/server';
import { getConnectionPool, sql } from '@/lib/db';
import type { MenuItem } from '@/lib/types';

export const revalidate = 0;

/**
 * Handles GET requests to /api/deals.
 * Fetches all items that are categorized as deals.
 */
export async function GET(request: Request) {
  try {
    const pool = await getConnectionPool();
    // Assuming deals are menu items with a specific categoryId, e.g., 'C-00001'
    const result = await pool.request()
      .input('DealCategoryId', sql.NVarChar, 'C-00001')
      .query('SELECT * FROM MenuItems WHERE categoryId = @DealCategoryId');
    
    const deals = result.recordset.map(deal => ({
      ...deal,
      availableAddonIds: deal.availableAddonIds ? JSON.parse(deal.availableAddonIds) : [],
      variants: deal.variants ? JSON.parse(deal.variants) : [],
      dealItems: deal.dealItems ? JSON.parse(deal.dealItems) : [],
    }));

    return NextResponse.json({ deals }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    if (error.number === 208) { // Table does not exist
      return NextResponse.json({ deals: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }
    // If the table doesn't exist yet, return an empty array gracefully.
    console.warn('Could not fetch deals from database. This might be okay if the table is not created yet.', error.message);
    return NextResponse.json({ deals: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }
}

// POST, PUT, DELETE for deals would be handled through the /api/menu endpoint
// since deals are just a special type of MenuItem.
