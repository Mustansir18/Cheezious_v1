
import { NextResponse } from 'next/server';
import { getConnectionPool, sql } from '@/lib/db';
import type { CartItem, User } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid'; // For generating session IDs

// Helper function to get or create a session ID from headers
function getSessionId(request: Request): string {
    let sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
        sessionId = uuidv4();
    }
    return sessionId;
}

async function getUserFromSession(request: Request): Promise<User | null> {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) return null;

    try {
        const pool = await getConnectionPool();
        const result = await pool.request()
            .input('SessionId', sql.NVarChar, sessionId)
            .query(`SELECT u.id, u.username, u.role, u.branchId, u.balance, u.stationName FROM Users u JOIN Sessions s ON u.id = s.UserId WHERE s.Id = @SessionId AND s.ExpiresAt > GETUTCDATE()`);
        
        return result.recordset[0] || null;
    } catch {
        return null;
    }
}

// GET /api/cart
// Fetches the current user's or guest's cart from the database
export async function GET(request: Request) {
    const sessionId = getSessionId(request);
    const user = await getUserFromSession(request);

    try {
        const pool = await getConnectionPool();
        let cartQuery = '';
        const requestPool = pool.request();

        if (user) {
            cartQuery = 'SELECT * FROM Carts WHERE UserId = @Identifier';
            requestPool.input('Identifier', sql.NVarChar, user.id);
        } else {
            cartQuery = 'SELECT * FROM Carts WHERE SessionId = @Identifier AND UserId IS NULL';
            requestPool.input('Identifier', sql.NVarChar, sessionId);
        }
        
        const cartResult = await requestPool.query(cartQuery);
        let cart = cartResult.recordset[0];

        if (!cart) {
            // No cart exists, return an empty one but include the session ID for the client
            const response = NextResponse.json({ cart: null, items: [] });
            response.headers.set('x-session-id', sessionId);
            return response;
        }
        
        const itemsResult = await pool.request()
            .input('CartId', sql.UniqueIdentifier, cart.Id)
            .query('SELECT * FROM CartItems WHERE CartId = @CartId');
        
        const items = itemsResult.recordset.map(item => ({
            ...item,
            selectedAddons: item.SelectedAddons ? JSON.parse(item.SelectedAddons) : [],
            selectedVariant: item.SelectedVariant ? JSON.parse(item.SelectedVariant) : undefined,
        }));
        
        const response = NextResponse.json({ cart, items });
        response.headers.set('x-session-id', sessionId);
        return response;

    } catch (error: any) {
        console.error('[API/CART - GET] Error:', error);
        return NextResponse.json({ message: 'Failed to fetch cart', error: error.message }, { status: 500 });
    }
}


// POST /api/cart
// Creates or updates a user's or guest's cart
export async function POST(request: Request) {
    const sessionId = getSessionId(request);
    const user = await getUserFromSession(request);
    const { cartDetails, items }: { cartDetails: any, items: CartItem[] } = await request.json();

    const transaction = new sql.Transaction(await getConnectionPool());
    try {
        await transaction.begin();

        let findCartQuery = '';
        const findRequest = transaction.request();
        if (user) {
            findCartQuery = 'SELECT Id FROM Carts WHERE UserId = @Identifier';
            findRequest.input('Identifier', sql.NVarChar, user.id);
        } else {
            findCartQuery = 'SELECT Id FROM Carts WHERE SessionId = @Identifier AND UserId IS NULL';
            findRequest.input('Identifier', sql.NVarChar, sessionId);
        }
        
        let cartResult = await findRequest.query(findCartQuery);
        let cartId: string;

        if (cartResult.recordset.length > 0) {
            cartId = cartResult.recordset[0].Id;
            // Update existing cart
            await transaction.request()
                .input('Id', sql.UniqueIdentifier, cartId)
                .input('BranchId', sql.NVarChar, cartDetails.branchId)
                .input('OrderType', sql.NVarChar, cartDetails.orderType)
                .input('TableId', sql.NVarChar, cartDetails.tableId)
                .input('FloorId', sql.NVarChar, cartDetails.floorId)
                .input('DeliveryMode', sql.NVarChar, cartDetails.deliveryMode)
                .input('CustomerName', sql.NVarChar, cartDetails.customerName)
                .input('CustomerPhone', sql.NVarChar, cartDetails.customerPhone)
                .input('CustomerAddress', sql.NVarChar, cartDetails.customerAddress)
                .input('UpdatedAt', sql.DateTime2, new Date())
                .query(`UPDATE Carts SET 
                    BranchId = @BranchId, OrderType = @OrderType, TableId = @TableId, FloorId = @FloorId, 
                    DeliveryMode = @DeliveryMode, CustomerName = @CustomerName, CustomerPhone = @CustomerPhone,
                    CustomerAddress = @CustomerAddress, UpdatedAt = @UpdatedAt
                    WHERE Id = @Id`);
        } else {
            // Create new cart
            const createRequest = transaction.request()
                .input('SessionId', sql.NVarChar, sessionId)
                .input('BranchId', sql.NVarChar, cartDetails.branchId)
                .input('OrderType', sql.NVarChar, cartDetails.orderType)
                .input('TableId', sql.NVarChar, cartDetails.tableId)
                .input('FloorId', sql.NVarChar, cartDetails.floorId)
                .input('DeliveryMode', sql.NVarChar, cartDetails.deliveryMode)
                .input('CustomerName', sql.NVarChar, cartDetails.customerName)
                .input('CustomerPhone', sql.NVarChar, cartDetails.customerPhone)
                .input('CustomerAddress', sql.NVarChar, cartDetails.customerAddress);

            let insertQuery = `INSERT INTO Carts (SessionId, UserId, BranchId, OrderType, TableId, FloorId, DeliveryMode, CustomerName, CustomerPhone, CustomerAddress) 
                               OUTPUT inserted.Id
                               VALUES (@SessionId, @UserId, @BranchId, @OrderType, @TableId, @FloorId, @DeliveryMode, @CustomerName, @CustomerPhone, @CustomerAddress)`;
            
            if (user) {
                createRequest.input('UserId', sql.NVarChar, user.id);
            } else {
                insertQuery = insertQuery.replace('@UserId', 'NULL');
            }
            
            const newCartResult = await createRequest.query(insertQuery);
            cartId = newCartResult.recordset[0].Id;
        }

        // Clear existing items for this cart
        await transaction.request()
            .input('CartId', sql.UniqueIdentifier, cartId)
            .query('DELETE FROM CartItems WHERE CartId = @CartId');
        
        // Insert new items
        for (const item of items) {
            await transaction.request()
                .input('CartId', sql.UniqueIdentifier, cartId)
                .input('MenuItemId', sql.NVarChar, item.id)
                .input('Quantity', sql.Int, item.quantity)
                .input('Price', sql.Decimal(10,2), item.price)
                .input('BasePrice', sql.Decimal(10,2), item.basePrice)
                .input('Name', sql.NVarChar, item.name)
                .input('SelectedAddons', sql.NVarChar, JSON.stringify(item.selectedAddons))
                .input('SelectedVariant', sql.NVarChar, JSON.stringify(item.selectedVariant))
                .input('StationId', sql.NVarChar, item.stationId)
                .input('IsDealComponent', sql.Bit, item.isDealComponent)
                .input('ParentDealCartItemId', sql.UniqueIdentifier, item.parentDealCartItemId)
                .input('Instructions', sql.NVarChar, item.instructions)
                .query(`INSERT INTO CartItems (CartId, MenuItemId, Quantity, Price, BasePrice, Name, SelectedAddons, SelectedVariant, StationId, IsDealComponent, ParentDealCartItemId, Instructions) 
                        VALUES (@CartId, @MenuItemId, @Quantity, @Price, @BasePrice, @Name, @SelectedAddons, @SelectedVariant, @StationId, @IsDealComponent, @ParentDealCartItemId, @Instructions)`);
        }
        
        await transaction.commit();

        const response = NextResponse.json({ success: true, cartId, sessionId });
        response.headers.set('x-session-id', sessionId);
        return response;

    } catch (error: any) {
        await transaction.rollback();
        console.error('[API/CART - POST] Error:', error);
        return NextResponse.json({ message: 'Failed to update cart', error: error.message }, { status: 500 });
    }
}
