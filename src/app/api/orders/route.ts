
import { NextResponse } from 'next/server';
import { getConnectionPool, sql } from '@/lib/db';
import type { Order, OrderItem } from '@/lib/types';

export const revalidate = 0;

/**
 * Handles GET requests to /api/orders.
 * In a real application, this would fetch recent orders.
 */
export async function GET(request: Request) {
  try {
    const pool = await getConnectionPool();
    // Example: Fetch orders from the last 24 hours
    const result = await pool.request()
      .query(`
        SELECT * FROM Orders 
        WHERE OrderDate >= DATEADD(day, -1, GETDATE())
        ORDER BY OrderDate DESC
      `);

    const orders = result.recordset;

    // Fetch items for each order
    for (const order of orders) {
      const itemsResult = await pool.request()
        .input('orderId', sql.NVarChar, order.id)
        .query('SELECT * FROM OrderItems WHERE orderId = @orderId');
      
      // The `selectedAddons` is stored as a JSON string in the DB.
      order.items = itemsResult.recordset.map(item => ({
          ...item,
          selectedAddons: item.selectedAddons ? JSON.parse(item.selectedAddons) : [],
          selectedVariant: item.selectedVariant ? JSON.parse(item.selectedVariant) : undefined,
      }));
    }

    return NextResponse.json({ orders }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    if (error.number === 208) { // Table does not exist
      return NextResponse.json({ orders: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }
    // If the query fails (e.g., table doesn't exist), log the error and return an empty array.
    console.warn('Could not fetch orders from database, returning empty array. Error:', error.message);
    return NextResponse.json({ orders: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }
}


/**
 * Handles POST requests to /api/orders.
 * This function inserts a new order and its items into the database.
 */
export async function POST(request: Request) {
  const order: Order = await request.json();

  try {
    const pool = await getConnectionPool();
    const transaction = new sql.Transaction(pool);
    
    await transaction.begin();

    try {
      // Insert into the main Orders table
      await transaction.request()
        .input('id', sql.NVarChar, order.id)
        .input('orderNumber', sql.NVarChar, order.orderNumber)
        .input('branchId', sql.NVarChar, order.branchId)
        .input('orderDate', sql.DateTime, new Date(order.orderDate))
        .input('orderType', sql.NVarChar, order.orderType)
        .input('status', sql.NVarChar, order.status)
        .input('totalAmount', sql.Decimal(10, 2), order.totalAmount)
        .input('subtotal', sql.Decimal(10, 2), order.subtotal)
        .input('taxRate', sql.Decimal(4, 2), order.taxRate)
        .input('taxAmount', sql.Decimal(10, 2), order.taxAmount)
        .input('paymentMethod', sql.NVarChar, order.paymentMethod)
        .input('instructions', sql.NVarChar, order.instructions)
        .input('placedBy', sql.NVarChar, order.placedBy)
        .input('floorId', sql.NVarChar, order.floorId)
        .input('tableId', sql.NVarChar, order.tableId)
        .input('deliveryMode', sql.NVarChar, order.deliveryMode)
        .input('customerName', sql.NVarChar, order.customerName)
        .input('customerPhone', sql.NVarChar, order.customerPhone)
        .input('customerAddress', sql.NVarChar, order.customerAddress)
        .query(`
          INSERT INTO Orders (id, orderNumber, branchId, orderDate, orderType, status, totalAmount, subtotal, taxRate, taxAmount, paymentMethod, instructions, placedBy, floorId, tableId, deliveryMode, customerName, customerPhone, customerAddress)
          VALUES (@id, @orderNumber, @branchId, @orderDate, @orderType, @status, @totalAmount, @subtotal, @taxRate, @taxAmount, @paymentMethod, @instructions, @placedBy, @floorId, @tableId, @deliveryMode, @customerName, @customerPhone, @customerAddress)
        `);

      // Insert each order item
      for (const item of order.items) {
        await transaction.request()
          .input('id', sql.NVarChar, item.id)
          .input('orderId', sql.NVarChar, order.id)
          .input('menuItemId', sql.NVarChar, item.menuItemId)
          .input('quantity', sql.Int, item.quantity)
          .input('itemPrice', sql.Decimal(10, 2), item.itemPrice)
          .input('baseItemPrice', sql.Decimal(10, 2), item.baseItemPrice)
          .input('name', sql.NVarChar, item.name)
          .input('selectedAddons', sql.NVarChar, JSON.stringify(item.selectedAddons || []))
          .input('selectedVariant', sql.NVarChar, JSON.stringify(item.selectedVariant || null))
          .input('stationId', sql.NVarChar, item.stationId)
          .input('isPrepared', sql.Bit, item.isPrepared ? 1 : 0)
          .input('isDealComponent', sql.Bit, item.isDealComponent ? 1 : 0)
          .input('parentDealCartItemId', sql.NVarChar, item.parentDealCartItemId)
          .input('instructions', sql.NVarChar, item.instructions)
          .query(`
            INSERT INTO OrderItems (id, orderId, menuItemId, quantity, itemPrice, baseItemPrice, name, selectedAddons, selectedVariant, stationId, isPrepared, isDealComponent, parentDealCartItemId, instructions)
            VALUES (@id, @orderId, @menuItemId, @quantity, @itemPrice, @baseItemPrice, @name, @selectedAddons, @selectedVariant, @stationId, @isPrepared, @isDealComponent, @parentDealCartItemId, @instructions)
          `);
      }

      await transaction.commit();
      
      return NextResponse.json(order, { status: 201 });

    } catch (err) {
      await transaction.rollback();
      throw err; // Rethrow to be caught by the outer try-catch
    }

  } catch (error: any) {
    console.error('Failed to create order:', error);
    return NextResponse.json({ message: 'Failed to create order', error: error.message }, { status: 500 });
  }
}
