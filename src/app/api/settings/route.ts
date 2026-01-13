
import { NextResponse } from 'next/server';
import { getConnectionPool, sql } from '@/lib/db';
import type { Settings } from '@/lib/types';
import { initialDeals } from '@/lib/data';

const getGlobalSettings = async (pool: any) => {
    // In a real app, this would be a table `GlobalSettings` with key-value pairs
    // For now, we are hardcoding these but a real implementation would fetch them.
    return {
        companyName: "Cheezious",
        companyLogo: '/images/logo.png',
        defaultBranchId: "B-00001",
        autoPrintReceipts: false,
        businessDayStart: "11:00",
        businessDayEnd: "04:00",
        promotion: {
            isEnabled: true,
            itemId: initialDeals[0].id,
            imageUrl: initialDeals[0].imageUrl
        }
    };
};

const getSettingsFromDb = async (): Promise<Settings | null> => {
    try {
        const pool = await getConnectionPool();
        const [branches, floors, tables, paymentMethods, deliveryModes, roles] = await Promise.all([
            pool.request().query('SELECT * FROM Branches'),
            pool.request().query('SELECT * FROM Floors'),
            pool.request().query('SELECT * FROM Tables'),
            pool.request().query('SELECT * FROM PaymentMethods'),
            pool.request().query('SELECT * FROM DeliveryModes'),
            pool.request().query('SELECT * FROM Roles'),
        ]);

        const globalSettings = await getGlobalSettings(pool);

        return {
            ...globalSettings,
            branches: branches.recordset,
            floors: floors.recordset,
            tables: tables.recordset,
            paymentMethods: paymentMethods.recordset,
            deliveryModes: deliveryModes.recordset,
            roles: roles.recordset.map(r => ({ ...r, permissions: JSON.parse(r.permissions) })),
        };
    } catch (error: any) {
        if (error.code === 'EREQUEST' && error.message.includes('Invalid object name')) {
            console.warn("One or more settings tables not found. Returning null.");
            return null;
        }
        throw error;
    }
};

export async function GET(request: Request) {
    try {
        const settings = await getSettingsFromDb();
        if (settings) {
            return NextResponse.json({ settings });
        }
        // Fallback for initial setup before migration
        return NextResponse.json({ settings: null });
    } catch (error: any) {
        console.error('Failed to fetch settings:', error);
        return NextResponse.json({ message: 'Failed to fetch settings', error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { action, payload } = await request.json();

    try {
        const pool = await getConnectionPool();
        const req = pool.request();

        switch (action) {
            // BRANCHES
            case 'addBranch':
                await req.input('id', sql.NVarChar, payload.id).input('name', sql.NVarChar, payload.name).input('orderPrefix', sql.NVarChar, payload.orderPrefix).query('INSERT INTO Branches (id, name, orderPrefix) VALUES (@id, @name, @orderPrefix)');
                break;
            case 'updateBranch':
                await req.input('id', sql.NVarChar, payload.id).input('name', sql.NVarChar, payload.name).input('orderPrefix', sql.NVarChar, payload.orderPrefix).query('UPDATE Branches SET name = @name, orderPrefix = @orderPrefix WHERE id = @id');
                break;
            case 'deleteBranch':
                await req.input('id', sql.NVarChar, payload.id).query('DELETE FROM Branches WHERE id = @id');
                break;
            case 'toggleService':
                await req.input('id', sql.NVarChar, payload.branchId).input('enabled', sql.Bit, payload.enabled).query(`UPDATE Branches SET ${payload.service} = @enabled WHERE id = @id`);
                break;
            
            // FLOORS
            case 'addFloor':
                await req.input('id', sql.NVarChar, payload.id).input('name', sql.NVarChar, payload.name).query('INSERT INTO Floors (id, name) VALUES (@id, @name)');
                break;
            case 'deleteFloor':
                await req.input('id', sql.NVarChar, payload.id).query('DELETE FROM Tables WHERE floorId = @id; DELETE FROM Floors WHERE id = @id;');
                break;

            // TABLES
            case 'addTable':
                await req.input('id', sql.NVarChar, payload.id).input('name', sql.NVarChar, payload.name).input('floorId', sql.NVarChar, payload.floorId).query('INSERT INTO Tables (id, name, floorId) VALUES (@id, @name, @floorId)');
                break;
            case 'deleteTable':
                await req.input('id', sql.NVarChar, payload.id).query('DELETE FROM Tables WHERE id = @id');
                break;

            // PAYMENT
            case 'addPaymentMethod':
                await req.input('id', sql.NVarChar, payload.id).input('name', sql.NVarChar, payload.name).input('taxRate', sql.Decimal(5, 2), payload.taxRate || 0).query('INSERT INTO PaymentMethods (id, name, taxRate) VALUES (@id, @name, @taxRate)');
                break;
            case 'deletePaymentMethod':
                await req.input('id', sql.NVarChar, payload.id).query('DELETE FROM PaymentMethods WHERE id = @id');
                break;
            case 'updatePaymentMethodTaxRate':
                await req.input('id', sql.NVarChar, payload.id).input('taxRate', sql.Decimal(5, 2), payload.taxRate).query('UPDATE PaymentMethods SET taxRate = @taxRate WHERE id = @id');
                break;

            // DELIVERY
            case 'addDeliveryMode':
                 await req.input('id', sql.NVarChar, payload.id).input('name', sql.NVarChar, payload.name).query('INSERT INTO DeliveryModes (id, name) VALUES (@id, @name)');
                break;
            case 'deleteDeliveryMode':
                await req.input('id', sql.NVarChar, payload.id).query('DELETE FROM DeliveryModes WHERE id = @id');
                break;

            // ROLES
            case 'addRole':
                await req.input('id', sql.NVarChar, payload.id).input('name', sql.NVarChar, payload.name).input('permissions', sql.NVarChar, JSON.stringify(payload.permissions)).query('INSERT INTO Roles (id, name, permissions) VALUES (@id, @name, @permissions)');
                break;
            case 'updateRole':
                 await req.input('id', sql.NVarChar, payload.id).input('name', sql.NVarChar, payload.name).input('permissions', sql.NVarChar, JSON.stringify(payload.permissions)).query('UPDATE Roles SET name = @name, permissions = @permissions WHERE id = @id');
                break;
            case 'deleteRole':
                await req.input('id', sql.NVarChar, payload.id).query('DELETE FROM Roles WHERE id = @id');
                break;

            // GLOBAL SETTINGS (would be a separate table in a real app)
            case 'updateGlobal':
                console.log("Global settings updates are not persisted to the DB in this version.");
                break;

            default:
                return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
        }
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(`Failed to execute settings action '${action}':`, error);
        return NextResponse.json({ message: `Failed to update settings for action: ${action}`, error: error.message }, { status: 500 });
    }
}
