
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
            
            <div className="mb-2 space-y-1">
                <div className="flex justify-between">
                    <span>Order #:</span>
                    <span>{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{new Date(order.orderDate).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                    <span>Type:</span>
                    <span>{order.orderType}</span>
                </div>
                {table && (
                    <div className="flex justify-between">
                        <span>Table:</span>
                        <span>{table.name}</span>
                    </div>
                )}
            </div>
            
            <hr className="border-dashed border-black my-2" />
            
            <div className="space-y-1">
                {order.items.map(item => (
                    <div key={item.id} className="flex justify-between">
                        <span className="pr-2">{item.quantity}x {item.name}</span>
                        <span className="shrink-0">{(item.itemPrice * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>
            
            <hr className="border-dashed border-black my-2" />
            
            <div className="space-y-1">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tax ({(order.taxRate * 100).toFixed(0)}%):</span>
                    <span>{order.taxAmount.toFixed(2)}</span>
                </div>
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
