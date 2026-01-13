
import { NextResponse } from 'next/server';
import { getConnectionPool, sql } from '@/lib/db';
import type { Settings } from '@/lib/types';
import { initialDeals } from '@/lib/data';


async function getSettingsFromDb(): Promise<Settings | null> {
    try {
        const pool = await getConnectionPool();
        const [branches, floors, tables, paymentMethods, deliveryModes] = await Promise.all([
            pool.request().query('SELECT * FROM Branches'),
            pool.request().query('SELECT * FROM Floors'),
            pool.request().query('SELECT * FROM Tables'),
            pool.request().query('SELECT * FROM PaymentMethods'),
            pool.request().query('SELECT * FROM DeliveryModes')
            // Roles, company info, etc., could be fetched from another table or config file
        ]);

        // This is a simplified fetch. A real app would get companyName etc. from a config table.
        return {
            branches: branches.recordset,
            floors: floors.recordset,
            tables: tables.recordset,
            paymentMethods: paymentMethods.recordset,
            deliveryModes: deliveryModes.recordset,
            // Hardcoded values that would normally come from a 'Globals' or 'CompanyInfo' table
            companyName: "Cheezious",
            companyLogo: "/images/logo.png",
            defaultBranchId: "B-00001",
            autoPrintReceipts: false,
            businessDayStart: "11:00",
            businessDayEnd: "04:00",
            roles: [], // Roles are static for now
            promotion: { isEnabled: false, itemId: null, imageUrl: '' }, // Promotions from DB
        };
    } catch (error: any) {
        if (error.number === 208) { // Table not found
            console.warn("One or more settings tables not found. Returning null.");
            return null;
        }
        throw error;
    }
}


export async function GET(request: Request) {
    try {
        const settings = await getSettingsFromDb();
        if (settings) {
            return NextResponse.json({ settings });
        }
        // Fallback to initial data if DB is not set up

        const fallbackSettings = {
            floors: [{ id: 'F-00001', name: 'Ground' }],
            tables: [{ id: 'T-G-1', name: 'Table 1', floorId: 'F-00001' }],
            paymentMethods: [{ id: 'PM-1', name: 'Cash', taxRate: 0.16 }],
            autoPrintReceipts: false,
            companyName: "Cheezious",
            companyLogo: '/images/logo.png',
            branches: [{ id: 'B-00001', name: 'CHZ J3, JOHAR TOWN LAHORE', dineInEnabled: true, takeAwayEnabled: true, deliveryEnabled: true, orderPrefix: 'G3' }],
            defaultBranchId: 'B-00001',
            businessDayStart: "11:00",
            businessDayEnd: "04:00",
            roles: [],
            deliveryModes: [{ id: 'DM-1', name: 'Website' }],
            promotion: {
                isEnabled: true,
                itemId: initialDeals[0].id,
                imageUrl: initialDeals[0].imageUrl
            }
        };
        return NextResponse.json({ settings: fallbackSettings });
    } catch (error: any) {
        console.error('Failed to fetch settings:', error);
        return NextResponse.json({ message: 'Failed to fetch settings', error: error.message }, { status: 500 });
    }
}

// POST endpoint to update the whole settings object
export async function POST(request: Request) {
    const { settings } = await request.json();
    if (!settings) {
        return NextResponse.json({ message: 'Settings object is required' }, { status: 400 });
    }

    const pool = await getConnectionPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Clear existing settings tables
        await transaction.request().query('DELETE FROM DeliveryModes');
        await transaction.request().query('DELETE FROM PaymentMethods');
        await transaction.request().query('DELETE FROM Tables');
        await transaction.request().query('DELETE FROM Floors');
        await transaction.request().query('DELETE FROM Branches');

        // Insert new settings
        for (const branch of settings.branches) {
             await transaction.request().input('id', sql.NVarChar, branch.id).input('name', sql.NVarChar, branch.name).input('orderPrefix', sql.NVarChar, branch.orderPrefix).input('dineInEnabled', sql.Bit, branch.dineInEnabled).input('takeAwayEnabled', sql.Bit, branch.takeAwayEnabled).input('deliveryEnabled', sql.Bit, branch.deliveryEnabled).query('INSERT INTO Branches (id, name, orderPrefix, dineInEnabled, takeAwayEnabled, deliveryEnabled) VALUES (@id, @name, @orderPrefix, @dineInEnabled, @takeAwayEnabled, @deliveryEnabled)');
        }
        for (const floor of settings.floors) {
             await transaction.request().input('id', sql.NVarChar, floor.id).input('name', sql.NVarChar, floor.name).query('INSERT INTO Floors (id, name) VALUES (@id, @name)');
        }
        for (const table of settings.tables) {
             await transaction.request().input('id', sql.NVarChar, table.id).input('name', sql.NVarChar, table.name).input('floorId', sql.NVarChar, table.floorId).query('INSERT INTO Tables (id, name, floorId) VALUES (@id, @name, @floorId)');
        }
        for (const pm of settings.paymentMethods) {
             await transaction.request().input('id', sql.NVarChar, pm.id).input('name', sql.NVarChar, pm.name).input('taxRate', sql.Decimal(5, 2), pm.taxRate).query('INSERT INTO PaymentMethods (id, name, taxRate) VALUES (@id, @name, @taxRate)');
        }
        for (const dm of settings.deliveryModes) {
             await transaction.request().input('id', sql.NVarChar, dm.id).input('name', sql.NVarChar, dm.name).query('INSERT INTO DeliveryModes (id, name) VALUES (@id, @name)');
        }
        
        // In a real app, other settings like companyName would also be saved to a table.
        
        await transaction.commit();
        return NextResponse.json({ message: 'Settings updated successfully' });
    } catch (error: any) {
        await transaction.rollback();
        console.error('Failed to update settings:', error);
        return NextResponse.json({ message: 'Failed to update settings', error: error.message }, { status: 500 });
    }
}
