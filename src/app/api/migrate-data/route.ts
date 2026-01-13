
import { NextResponse } from 'next/server';
import { getConnectionPool, sql } from '@/lib/db';
import type { MenuData } from '@/context/MenuContext';
import type { Settings } from '@/context/SettingsContext';

async function clearAllTables(transaction: sql.Transaction) {
    const tables = [
        'CartItems', 'Carts', 'Sessions', 'OrderItems', 'Orders',
        'ActivityLog', 'CashierLog', 'Ratings', 'Users', 'Addons', 
        'MenuItems', 'SubCategories', 'MenuCategories', 'Branches', 
        'Floors', 'Tables', 'PaymentMethods', 'DeliveryModes'
    ];
    for (const table of tables) {
        try {
            await transaction.request().query(`IF OBJECT_ID('dbo.${table}', 'U') IS NOT NULL DELETE FROM ${table};`);
            
            // Correctly check if the table has an identity column before reseeding
            const identityCheckResult = await transaction.request().query(`
                SELECT COUNT(*) as Count 
                FROM sys.identity_columns 
                WHERE OBJECT_ID = OBJECT_ID('dbo.${table}')
            `);

            if (identityCheckResult.recordset[0].Count > 0) {
                 await transaction.request().query(`DBCC CHECKIDENT ('[${table}]', RESEED, 0);`);
            }
        } catch (e: any) {
            // Ignore if table doesn't exist, but throw other errors
            if (e.number === 208) { 
                 console.warn(`Table ${table} not found for clearing, skipping.`);
            } else {
                console.error(`Error clearing table ${table}:`, e.message);
                throw e;
            }
        }
    }
}


export async function POST(request: Request) {
    const { menuData, settingsData, usersData, activityLogsData, cashierLogsData, ratingsData } = await request.json();
    
    const pool = await getConnectionPool();
    const transaction = new sql.Transaction(pool);
    
    try {
        await transaction.begin();

        console.log("--- Starting Data Migration ---");

        console.log("Step 1: Clearing existing data (if any)...");
        await clearAllTables(transaction);
        console.log("Step 1: Complete.");

        // Step 2: Migrate Settings
        console.log("Step 2: Migrating Settings...");
        const settings: Settings = settingsData;
        
        for (const branch of settings.branches) {
            await transaction.request()
                .input('id', sql.NVarChar, branch.id)
                .input('name', sql.NVarChar, branch.name)
                .input('orderPrefix', sql.NVarChar, branch.orderPrefix)
                .input('dineInEnabled', sql.Bit, branch.dineInEnabled)
                .input('takeAwayEnabled', sql.Bit, branch.takeAwayEnabled)
                .input('deliveryEnabled', sql.Bit, branch.deliveryEnabled)
                .query(`INSERT INTO Branches (id, name, orderPrefix, dineInEnabled, takeAwayEnabled, deliveryEnabled) VALUES (@id, @name, @orderPrefix, @dineInEnabled, @takeAwayEnabled, @deliveryEnabled)`);
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
        console.log("Step 2: Complete.");

        // Step 3: Migrate Users
        console.log("Step 3: Migrating Users...");
        for (const user of usersData) {
            await transaction.request()
                .input('id', sql.NVarChar, user.id)
                .input('username', sql.NVarChar, user.username)
                .input('password', sql.NVarChar, user.password)
                .input('role', sql.NVarChar, user.role)
                .input('branchId', sql.NVarChar, user.branchId)
                .input('balance', sql.Decimal(18, 2), user.balance || 0)
                .input('stationName', sql.NVarChar, user.stationName)
                .query('INSERT INTO Users (id, username, password, role, branchId, balance, stationName) VALUES (@id, @username, @password, @role, @branchId, @balance, @stationName)');
        }
        console.log("Step 3: Complete.");

        // Step 4: Migrate Menu
        console.log("Step 4: Migrating Menu...");
        const menu: MenuData = menuData;
        for (const category of menu.categories) {
            await transaction.request().input('id', sql.NVarChar, category.id).input('name', sql.NVarChar, category.name).input('icon', sql.NVarChar, category.icon).input('stationId', sql.NVarChar, category.stationId).query('INSERT INTO MenuCategories (id, name, icon, stationId) VALUES (@id, @name, @icon, @stationId)');
            if (category.subCategories) {
                for (const sub of category.subCategories) {
                     await transaction.request().input('id', sql.NVarChar, sub.id).input('categoryId', sql.NVarChar, category.id).input('name', sql.NVarChar, sub.name).query('INSERT INTO SubCategories (id, categoryId, name) VALUES (@id, @categoryId, @name)');
                }
            }
        }
        for (const addon of menu.addons) {
             await transaction.request().input('id', sql.NVarChar, addon.id).input('name', sql.NVarChar, addon.name).input('price', sql.Decimal(10, 2), addon.price).input('prices', sql.NVarChar, JSON.stringify(addon.prices)).input('type', sql.NVarChar, addon.type).query('INSERT INTO Addons (id, name, price, prices, type) VALUES (@id, @name, @price, @prices, @type)');
        }
        for (const item of menu.items) {
             await transaction.request()
                .input('id', sql.NVarChar, item.id)
                .input('name', sql.NVarChar, item.name)
                .input('description', sql.NVarChar, item.description)
                .input('price', sql.Decimal(10, 2), item.price)
                .input('categoryId', sql.NVarChar, item.categoryId)
                .input('subCategoryId', sql.NVarChar, item.subCategoryId)
                .input('imageUrl', sql.NVarChar, item.imageUrl)
                .input('availableAddonIds', sql.NVarChar, JSON.stringify(item.availableAddonIds || []))
                .input('variants', sql.NVarChar, JSON.stringify(item.variants || []))
                .input('dealItems', sql.NVarChar, JSON.stringify(item.dealItems || []))
                .query('INSERT INTO MenuItems (id, name, description, price, categoryId, subCategoryId, imageUrl, availableAddonIds, variants, dealItems) VALUES (@id, @name, @description, @price, @categoryId, @subCategoryId, @imageUrl, @availableAddonIds, @variants, @dealItems)');
        }
        console.log("Step 4: Complete.");

        // Step 5: Migrate Logs & Ratings (optional but good for testing)
        console.log("Step 5: Migrating Logs and Ratings...");
        for (const log of activityLogsData) {
             await transaction.request().input('id', sql.NVarChar, log.id).input('timestamp', sql.DateTime, new Date(log.timestamp)).input('user', sql.NVarChar, log.user).input('message', sql.NVarChar, log.message).input('category', sql.NVarChar, log.category).query('INSERT INTO ActivityLog (id, timestamp, [user], message, category) VALUES (@id, @timestamp, @user, @message, @category)');
        }
        for (const log of cashierLogsData) {
             await transaction.request().input('id', sql.NVarChar, log.id).input('timestamp', sql.DateTime, new Date(log.timestamp)).input('type', sql.NVarChar, log.type).input('amount', sql.Decimal(18, 2), log.amount).input('cashierId', sql.NVarChar, log.cashierId).input('cashierName', sql.NVarChar, log.cashierName).input('adminId', sql.NVarChar, log.adminId).input('adminName', sql.NVarChar, log.adminName).input('notes', sql.NVarChar, log.notes).query('INSERT INTO CashierLog (id, timestamp, type, amount, cashierId, cashierName, adminId, adminName, notes) VALUES (@id, @timestamp, @type, @amount, @cashierId, @cashierName, @adminId, @adminName, @notes)');
        }
        for (const rating of ratingsData) {
             await transaction.request().input('id', sql.NVarChar, rating.id).input('timestamp', sql.DateTime, new Date(rating.timestamp)).input('rating', sql.Int, rating.rating).input('comment', sql.NVarChar, rating.comment).query('INSERT INTO Ratings (id, timestamp, rating, comment) VALUES (@id, @timestamp, @rating, @comment)');
        }
        console.log("Step 5: Complete.");

        console.log("--- Data Migration Successful ---");
        await transaction.commit();

        return NextResponse.json({ message: "Data migration successful!" });

    } catch (error: any) {
        if(transaction.rolledBack === false) {
          await transaction.rollback();
        }
        console.error("--- Data Migration Failed ---");
        console.error(error);
        return NextResponse.json({ message: "Data migration failed", error: error.message }, { status: 500 });
    }
}
