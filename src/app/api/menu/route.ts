import { NextResponse } from 'next/server';
import { menuItems, menuCategories, addons } from '@/lib/data';

/**
 * Handles GET requests to /api/menu.
 * This is a placeholder and should be replaced with logic to fetch menu data from a database.
 */
export async function GET(request: Request) {
  // In a real application, you would fetch this data from your SQL database.
  const menuData = {
    items: menuItems,
    categories: menuCategories,
    addons: addons,
  };

  return NextResponse.json(menuData);
}
