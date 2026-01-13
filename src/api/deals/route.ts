
import { NextResponse } from 'next/server';
import { getConnectionPool, sql } from '@/lib/db';
import type { MenuItem } from '@/lib/types';

// This endpoint is now deprecated as deals are handled by /api/menu.
// It is kept for compatibility but should not be used for new features.
// It will gracefully return an empty array.

/**
 * Handles GET requests to /api/deals.
 * Fetches all items that are categorized as deals.
 * @deprecated Use the main /api/menu endpoint which includes deals.
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

        return NextResponse.json({ deals });
    } catch (error: any) {
        if (error.number === 208) { // Table does not exist
        return NextResponse.json({ deals: [] });
        }
        // If the table doesn't exist yet, return an empty array gracefully.
        console.warn('Could not fetch deals from database. This might be okay if the table is not created yet.', error.message);
        return NextResponse.json({ deals: [] });
    }
}
