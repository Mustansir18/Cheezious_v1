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
        <div className="p-4 bg-white text-black font-mono text-xs w-[300px] border border-gray-200">
            {/* Header */}
            <div className="text-center mb-4">
                <h2 className="font-bold text-sm">Cheezious</h2>
                <p className="uppercase text-[10px]">{branch?.name || "CHZ J3, JOHAR TOWN LAHORE"}</p>
                <p className="mt-2">--- Customer Receipt ---</p>
            </div>

            {/* Order Info - Vertical Stack */}
            <div className="mb-4 space-y-2">
                <div>
                    <div>Order #:</div>
                    <div className="font-bold">{order.orderNumber}</div>
                </div>
                <div>
                    <div>Date:</div>
                    <div className="font-bold">{new Date(order.orderDate).toLocaleDateString()}</div>
                </div>
                <div>
                    <div>Time:</div>
                    <div className="font-bold">{new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                </div>
                <div>
                    <div>Type:</div>
                    <div className="font-bold">{order.orderType}</div>
                </div>
            </div>

            <hr className="border-dashed border-black my-2" />

            {/* Items - Using Grid to force horizontal alignment */}
            <div className="space-y-1">
                {order.items.map(item => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto] gap-2 items-start">
                        <span className="break-words">{item.quantity}x {item.name}</span>
                        <span className="text-right tabular-nums whitespace-nowrap">
                            {(item.itemPrice * item.quantity).toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>

            <hr className="border-dashed border-black my-2" />

            {/* Subtotal & Tax - Using Grid */}
            <div className="space-y-1">
                <div className="grid grid-cols-[1fr_auto] gap-2">
                    <span>Subtotal:</span>
                    <span className="text-right tabular-nums">{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                    <span>Tax ({(order.taxRate * 100).toFixed(0)}%):</span>
                    <span className="text-right tabular-nums">{order.taxAmount.toFixed(2)}</span>
                </div>
            </div>

            <hr className="border-dashed border-black my-2" />

            {/* TOTAL - Using Grid */}
            <div className="grid grid-cols-[1fr_auto] gap-2 font-bold text-sm">
                <span>TOTAL:</span>
                <span className="text-right whitespace-nowrap">
                    RS {order.totalAmount.toFixed(2)}
                </span>
            </div>

            <hr className="border-dashed border-black my-2" />

            {/* Footer */}
            <div className="text-center mt-4 space-y-1">
                {order.paymentMethod && (
                    <p>Paid via: {order.paymentMethod}</p>
                )}
                <p className="mt-2">Thank you for your visit!</p>
                <p>Have a Cheezious Day!</p>
            </div>
        </div>
    );
}