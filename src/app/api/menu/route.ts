
import { NextResponse } from 'next/server';
import { getConnectionPool, sql } from '@/lib/db';
import type { MenuItem, MenuCategory, Addon } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export const revalidate = 0;

// Helper to safely parse JSON
const safeJsonParse = (jsonString: string | null, defaultVal: any = []) => {
    if (!jsonString) return defaultVal;
    try {
        return JSON.parse(jsonString);
    } catch {
        return defaultVal;
    }
};

// GET entire menu
export async function GET(request: Request) {
  try {
    const pool = await getConnectionPool();

    // Fetch all data in parallel
    const [itemsResult, categoriesResult, addonsResult, subCategoriesResult] = await Promise.all([
      pool.request().query('SELECT * FROM MenuItems'),
      pool.request().query('SELECT * FROM MenuCategories'),
      pool.request().query('SELECT * FROM Addons'),
      pool.request().query('SELECT * FROM SubCategories'),
    ]);

    const items = itemsResult.recordset.map((item: any) => ({
      ...item,
      availableAddonIds: safeJsonParse(item.availableAddonIds, []),
      variants: safeJsonParse(item.variants, []),
      dealItems: safeJsonParse(item.dealItems, []),
    }));
    
    const categories = categoriesResult.recordset.map((cat: any) => ({
      ...cat,
      subCategories: subCategoriesResult.recordset.filter(sub => sub.categoryId === cat.id) || [],
    }));

    const addons = addonsResult.recordset.map((addon: any) => ({
        ...addon,
        prices: safeJsonParse(addon.prices, {})
    }));

    return NextResponse.json({ menu: { items, categories, addons } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    if (error.number === 208) { // Table does not exist
      return NextResponse.json({ menu: { items: [], categories: [], addons: [] } }, { headers: { 'Cache-Control': 'no-store' } });
    }
    console.warn('Could not fetch menu from database. This might be okay if tables are not created yet.', error.message);
    return NextResponse.json({ menu: { items: [], categories: [], addons: [] } }, { headers: { 'Cache-Control': 'no-store' } });
  }
}

// POST new menu data (items, categories, addons)
export async function POST(request: Request) {
    const { type, data } = await request.json();

    try {
        const pool = await getConnectionPool();
        let query = '';
        const req = pool.request();

        switch (type) {
            case 'item':
                req.input('id', sql.NVarChar, data.id || uuidv4());
                req.input('name', sql.NVarChar, data.name);
                req.input('description', sql.NVarChar, data.description);
                req.input('price', sql.Decimal(10, 2), data.price);
                req.input('categoryId', sql.NVarChar, data.categoryId);
                req.input('subCategoryId', sql.NVarChar, data.subCategoryId);
                req.input('imageUrl', sql.NVarChar, data.imageUrl);
                req.input('availableAddonIds', sql.NVarChar, JSON.stringify(data.availableAddonIds || []));
                req.input('variants', sql.NVarChar, JSON.stringify(data.variants || []));
                req.input('dealItems', sql.NVarChar, JSON.stringify(data.dealItems || []));
                query = `INSERT INTO MenuItems (id, name, description, price, categoryId, subCategoryId, imageUrl, availableAddonIds, variants, dealItems) VALUES (@id, @name, @description, @price, @categoryId, @subCategoryId, @imageUrl, @availableAddonIds, @variants, @dealItems)`;
                break;
            case 'category':
                req.input('id', sql.NVarChar, data.id || uuidv4());
                req.input('name', sql.NVarChar, data.name);
                req.input('icon', sql.NVarChar, data.icon);
                req.input('stationId', sql.NVarChar, data.stationId);
                query = `INSERT INTO MenuCategories (id, name, icon, stationId) VALUES (@id, @name, @icon, @stationId)`;
                break;
            case 'addon':
                req.input('id', sql.NVarChar, data.id || uuidv4());
                req.input('name', sql.NVarChar, data.name);
                req.input('price', sql.Decimal(10, 2), data.price);
                req.input('prices', sql.NVarChar, JSON.stringify(data.prices || {}));
                req.input('type', sql.NVarChar, data.type);
                query = `INSERT INTO Addons (id, name, price, prices, type) VALUES (@id, @name, @price, @prices, @type)`;
                break;
            case 'subCategory':
                req.input('id', sql.NVarChar, data.id || uuidv4());
                req.input('categoryId', sql.NVarChar, data.categoryId);
                req.input('name', sql.NVarChar, data.name);
                query = `INSERT INTO SubCategories (id, categoryId, name) VALUES (@id, @categoryId, @name)`;
                break;
            default:
                return NextResponse.json({ message: 'Invalid data type' }, { status: 400 });
        }

        await req.query(query);
        const savedData = { ...data, id: req.parameters.id.value };

        return NextResponse.json(savedData, { status: 201 });

    } catch (error: any) {
        console.error(`Failed to create menu ${type}:`, error);
        return NextResponse.json({ message: `Failed to create menu ${type}`, error: error.message }, { status: 500 });
    }
}
