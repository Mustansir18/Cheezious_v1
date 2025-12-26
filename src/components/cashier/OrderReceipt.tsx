
'use client';

import { Order } from "@/lib/types";
import { useSettings } from "@/context/SettingsContext";

interface OrderReceiptProps {
    order: Order;
}

export function OrderReceipt({ order }: OrderReceiptProps) {
    const { settings } = useSettings();
    const branch = settings.branches.find(b => b.id === order.branchId);
    const table = settings.tables.find(t => t.id === order.tableId);
    const floor = settings.floors.find(f => f.id === table?.floorId);

    const displayTotal = order.originalTotalAmount ?? order.totalAmount;

    return (
        <div className="p-4 bg-white text-black font-mono text-xs w-[300px] border border-gray-200">
            {/* Header */}
            <div className="text-center mb-4">
                <h2 className="font-bold text-sm">Cheezious</h2>
                <p className="uppercase text-[10px]">{branch?.name || "CHZ J3, JOHAR TOWN LAHORE"}</p>
                <p className="mt-2">--- Customer Receipt ---</p>
            </div>

            {/* Order Info */}
            <div className="mb-4 space-y-1">
                <div className="flex justify-between">
                    <span>Order #:</span>
                    <span className="font-bold">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-bold">{new Date(order.orderDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                    <span>Time:</span>
                    <span className="font-bold">{new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-bold">{order.orderType}</span>
                </div>
                 {order.orderType === 'Dine-In' && table && floor && (
                    <div className="flex justify-between">
                        <span>Table:</span>
                        <span className="font-bold">{floor.name} - {table.name}</span>
                    </div>
                 )}
            </div>

            <hr className="border-dashed border-black my-2" />

            {/* Items */}
            <div className="space-y-1">
                 <div className="flex justify-between font-bold">
                    <span>Item</span>
                    <span>Price</span>
                </div>
                {order.items.map(item => (
                    <div key={item.id}>
                        <div className="flex justify-between items-start gap-2">
                            <span className="break-words w-4/5">{item.quantity}x {item.name}</span>
                            <span className="text-right tabular-nums whitespace-nowrap">
                                {Math.round(item.baseItemPrice * item.quantity)}
                            </span>
                        </div>
                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                            <div className="pl-4">
                                {item.selectedAddons.map(addon => (
                                     <div key={addon.name} className="flex justify-between items-start gap-2 text-gray-600">
                                        <span className="break-words w-4/5">+ {addon.quantity}x {addon.name}</span>
                                        <span className="text-right tabular-nums whitespace-nowrap">
                                            {Math.round(addon.price * addon.quantity * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {order.instructions && (
                <>
                    <hr className="border-dashed border-black my-2" />
                    <div className="text-gray-600 italic">"{order.instructions}"</div>
                </>
            )}

            <hr className="border-dashed border-black my-2" />

            {/* Totals */}
            <div className="space-y-1">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-right tabular-nums">{Math.round(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tax ({(order.taxRate * 100).toFixed(0)}%):</span>
                    <span className="text-right tabular-nums">{Math.round(order.taxAmount)}</span>
                </div>
                {order.discountAmount && (
                    <div className="flex justify-between">
                        <span>Discount:</span>
                        <span className="text-right tabular-nums">-{Math.round(order.discountAmount)}</span>
                    </div>
                )}
            </div>

            <hr className="border-dashed border-black my-2" />

            {/* GRAND TOTAL */}
            <div className="flex justify-between font-bold text-sm">
                <span>TOTAL:</span>
                <span className="text-right whitespace-nowrap">
                    RS {Math.round(order.totalAmount)}
                </span>
            </div>

            <hr className="border-dashed border-black my-2" />

            {/* Footer */}
            <div className="text-center mt-4 space-y-1">
                {order.isComplementary ? (
                     <p className="font-bold">COMPLEMENTARY ({order.complementaryReason})</p>
                ) : order.paymentMethod && (
                    <p>Paid via: {order.paymentMethod}</p>
                )}
                <p className="mt-2">Thank you for your visit!</p>
                <p>Have a Cheezious Day!</p>
            </div>
        </div>
    );
}
