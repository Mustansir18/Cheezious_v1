
import { NextResponse } from 'next/server';
import { getConnectionPool, sql } from '@/lib/db';
import type { OrderItem, CartItem } from '@/lib/types';
import { useMenu } from '@/context/MenuContext'; // Can't use hooks server-side
import { menuItems, menuCategories } from '@/lib/data'; // Use raw data instead

// This route handles updates to a specific order.

export async function PUT(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const orderId = params.orderId;
  const { action, ...payload } = await request.json();

  if (!orderId) {
    return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
  }

  try {
    const pool = await getConnectionPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        let orderResult = await transaction.request().input('orderId', sql.NVarChar, orderId).query('SELECT * FROM Orders WHERE id = @orderId');
        if (orderResult.recordset.length === 0) {
            throw new Error('Order not found.');
        }
        const currentOrder = orderResult.recordset[0];

      switch (action) {
        case 'updateStatus':
            const { status, reason } = payload;
            await transaction.request()
                .input('orderId', sql.NVarChar, orderId)
                .input('status', sql.NVarChar, status)
                .input('completionDate', sql.DateTime, (status === 'Completed' || status === 'Cancelled') ? new Date() : null)
                .input('cancellationReason', sql.NVarChar, reason)
                .query('UPDATE Orders SET status = @status, completionDate = @completionDate, cancellationReason = @cancellationReason WHERE id = @orderId');
            break;

        case 'addItems':
            const itemsToAdd: CartItem[] = payload.items;
            let subtotalIncrease = 0;

            for (const item of itemsToAdd) {
                const menuItem = menuItems.find(mi => mi.id === item.id);
                if (!menuItem) continue;

                const category = menuCategories.find(c => c.id === menuItem.categoryId);
                const parentOrderItemId = item.cartItemId;

                await transaction.request()
                  .input('id', sql.NVarChar, parentOrderItemId)
                  .input('orderId', sql.NVarChar, orderId)
                  .input('menuItemId', sql.NVarChar, item.id)
                  .input('name', sql.NVarChar, item.name)
                  .input('quantity', sql.Int, item.quantity)
                  .input('itemPrice', sql.Decimal(18, 2), item.price)
                  .input('baseItemPrice', sql.Decimal(18, 2), item.basePrice)
                  .input('selectedAddons', sql.NVarChar, JSON.stringify(item.selectedAddons || []))
                  .input('selectedVariant', sql.NVarChar, JSON.stringify(item.selectedVariant || null))
                  .input('stationId', sql.NVarChar, category?.stationId)
                  .input('instructions', sql.NVarChar, item.instructions)
                  .query('INSERT INTO OrderItems (id, orderId, menuItemId, name, quantity, itemPrice, baseItemPrice, selectedAddons, selectedVariant, stationId, instructions, isPrepared) VALUES (@id, @orderId, @menuItemId, @name, @quantity, @itemPrice, @baseItemPrice, @selectedAddons, @selectedVariant, @stationId, @instructions, 0)');
                
                subtotalIncrease += item.price * item.quantity;
            }
             await transaction.request()
                .input('orderId', sql.NVarChar, orderId)
                .input('subtotalIncrease', sql.Decimal(18, 2), subtotalIncrease)
                .query(`
                    UPDATE Orders 
                    SET 
                        subtotal = subtotal + @subtotalIncrease,
                        taxAmount = (subtotal + @subtotalIncrease) * taxRate,
                        totalAmount = (subtotal + @subtotalIncrease) * (1 + taxRate) - ISNULL(discountAmount, 0),
                        originalTotalAmount = ISNULL(originalTotalAmount, totalAmount) + @subtotalIncrease
                    WHERE id = @orderId
                `);
            break;

        case 'togglePrepared':
             await transaction.request()
                .input('orderId', sql.NVarChar, orderId)
                .input('itemIds', sql.NVarChar, payload.itemIds.join(','))
                .query(`
                    UPDATE OrderItems 
                    SET isPrepared = CASE WHEN isPrepared = 1 THEN 0 ELSE 1 END 
                    WHERE orderId = @orderId AND id IN (SELECT value FROM STRING_SPLIT(@itemIds, ','))
                `);
            break;
        case 'dispatchItem':
             await transaction.request()
                .input('itemId', sql.NVarChar, payload.itemId)
                .query('UPDATE OrderItems SET isDispatched = 1 WHERE id = @itemId');
            // Check if all items are dispatched and update order status
            const result = await transaction.request().input('orderId', sql.NVarChar, orderId).query('SELECT COUNT(*) as total, SUM(CASE WHEN isDispatched=1 THEN 1 ELSE 0 END) as dispatched FROM OrderItems WHERE orderId = @orderId AND stationId IS NOT NULL');
            if (result.recordset[0].total === result.recordset[0].dispatched) {
                await transaction.request().input('orderId', sql.NVarChar, orderId).query("UPDATE Orders SET status = 'Ready' WHERE id = @orderId");
            } else {
                 await transaction.request().input('orderId', sql.NVarChar, orderId).query("UPDATE Orders SET status = 'Partial Ready' WHERE id = @orderId");
            }
            break;
        case 'applyAdjustment':
            const { details } = payload;
            let updateQuery = 'UPDATE Orders SET ';
            const req = transaction.request().input('orderId', sql.NVarChar, orderId);

            if (details.isComplementary) {
                updateQuery += `isComplementary = 1, complementaryReason = @reason, totalAmount = 0, discountAmount = @total, originalTotalAmount = @total, discountType = NULL, discountValue = NULL`;
                req.input('reason', sql.NVarChar, details.complementaryReason);
                req.input('total', sql.Decimal(18,2), currentOrder.totalAmount);
            } else if (details.discountType && details.discountValue) {
                const originalTotal = currentOrder.originalTotalAmount ?? currentOrder.totalAmount;
                let discountAmount = details.discountType === 'percentage'
                    ? originalTotal * (details.discountValue / 100)
                    : details.discountValue;
                
                updateQuery += `isComplementary = 0, complementaryReason = NULL, discountType = @type, discountValue = @value, discountAmount = @amount, totalAmount = @newTotal, originalTotalAmount = @originalTotal`;
                req.input('type', sql.NVarChar, details.discountType);
                req.input('value', sql.Decimal(18, 2), details.discountValue);
                req.input('amount', sql.Decimal(18, 2), discountAmount);
                req.input('newTotal', sql.Decimal(18, 2), Math.max(0, originalTotal - discountAmount));
                req.input('originalTotal', sql.Decimal(18, 2), originalTotal);
            }
            updateQuery += ' WHERE id = @orderId';
            await req.query(updateQuery);
            break;
        case 'changePayment':
            // Logic to fetch new tax rate would be needed here
            await transaction.request()
                .input('orderId', sql.NVarChar, orderId)
                .input('paymentMethod', sql.NVarChar, payload.paymentMethod)
                .query('UPDATE Orders SET paymentMethod = @paymentMethod WHERE id = @orderId');
            break;

        default:
          throw new Error('Invalid action for order update.');
      }
      
      await transaction.commit();
      return NextResponse.json({ success: true, message: 'Order updated successfully' });

    } catch (err: any) {
      await transaction.rollback();
      console.error(`[API/ORDERS/UPDATE] Error on action '${action}':`, err);
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`[API/ORDERS/UPDATE] General Error:`, error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
