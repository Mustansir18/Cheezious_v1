
'use client';

import { Order } from "@/lib/types";
import { branches } from "@/lib/data";
import { useSettings } from "@/context/SettingsContext";

interface OrderReceiptProps {
    order: Order;
}

export function OrderReceipt({ order }: OrderReceiptProps) {
    const { settings } = useSettings();
    const branch = branches.find(b => b.id === order.branchId);
    const table = settings.tables.find(t => t.id === order.tableId);

    return (
        <div className="p-4 bg-white text-black font-mono text-xs w-[300px]">
            <div className="text-center mb-4">
                <h2 className="font-bold text-sm">Cheezious</h2>
                <p className="text-xs">{branch?.name}</p>
                <p className="mt-2">--- Customer Receipt ---</p>
            </div>
            
            <div className="mb-2">
                <p><strong>Order #:</strong> {order.orderNumber}</p>
                <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleString()}</p>
                <p><strong>Type:</strong> {order.orderType}</p>
                {table && <p><strong>Table:</strong> {table.name}</p>}
            </div>
            
            <hr className="border-dashed border-black my-2" />
            
            {order.items.map(item => (
                <div key={item.id} className="flex justify-between">
                    <div className="flex-grow w-3/4 pr-2">
                        <p>{item.quantity}x {item.name}</p>
                    </div>
                    <div className="text-right">
                        <p>{(item.itemPrice * item.quantity).toFixed(2)}</p>
                    </div>
                </div>
            ))}
            
            <hr className="border-dashed border-black my-2" />
            
            <div className="flex justify-between">
                <p>Subtotal:</p>
                <p>{order.subtotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
                <p>Tax ({(order.taxRate * 100).toFixed(0)}%):</p>
                <p>{order.taxAmount.toFixed(2)}</p>
            </div>
            
            <hr className="border-dashed border-black my-2" />
            
            <div className="font-bold text-base flex justify-between">
                <span>TOTAL:</span>
                <span>RS {order.totalAmount.toFixed(2)}</span>
            </div>
            
            <hr className="border-dashed border-black my-2" />

            {order.paymentMethod && (
                 <p className="text-center">Paid via: {order.paymentMethod}</p>
            )}
            
            <p className="text-center mt-4">Thank you for your visit!</p>
            <p className="text-center">Have a Cheezious Day!</p>
        </div>
    );
}
