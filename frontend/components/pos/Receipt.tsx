import { format } from "date-fns";
import { forwardRef } from "react";

interface OrderItem {
    id: string;
    menuItem: { title: string; price: number };
    quantity: number;
}

interface Payment {
    id: number;
    amount: number;
    method: string;
}

interface Order {
    id: number;
    tableName: string;
    totalAmount: number;
    items: OrderItem[];
    createdAt: string;
    payments?: Payment[];
}

interface ReceiptProps {
    order?: Order;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ order }, ref) => {
    if (!order) return null;

    const subTotal = Number(order.totalAmount);
    // Assuming backend returns a field for discount or we calculate derived.
    // For now using simple 10% tax logic as consistently applied across app.
    // Ideally order object should contain 'tax' and 'discount' fields.

    // NOTE: In current backend implementation (OrdersService.getActiveOrder), 
    // it returns 'totalWithTax' field. We should check if 'order' prop has it.
    // If not, we re-calculate.
    // The 'order' passed here matches ActiveOrder interface which might lack tax info.
    // Let's implement safe calculation:

    // Updated Logic: User wants exact Item Sum as Total.
    const grandTotal = subTotal;
    const tax = 0; // Or if inclusive, maybe show derived, but for now 0 add-on.

    const totalPaid = order.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const remaining = grandTotal - totalPaid;
    const change = totalPaid > grandTotal ? totalPaid - grandTotal : 0;

    return (
        <div style={{ display: "none" }}>
            <div ref={ref} className="p-8 max-w-[300px] mx-auto font-mono text-sm leading-relaxed">
                <div className="text-center mb-6">
                    <h1 className="text-xl font-bold uppercase mb-2">Resto POS</h1>
                    <p className="text-xs text-muted-foreground">123 Food Street, City</p>
                    <p className="text-xs text-muted-foreground">Tel: +123 456 7890</p>
                </div>

                <div className="border-b border-dashed border-black mb-4 pb-2">
                    <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{format(new Date(), "dd/MM/yy HH:mm")}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Table:</span>
                        <span>{order.tableName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Order #:</span>
                        <span>{order.id}</span>
                    </div>
                </div>

                <div className="space-y-2 mb-4 border-b border-dashed border-black pb-4">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between">
                            <span className="truncate w-32">{item.menuItem?.title || "Item"} x{item.quantity}</span>
                            <span>₹{(Number(item.menuItem?.price) * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="space-y-1 mb-4 border-b border-dashed border-black pb-4">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{subTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tax (10%)</span>
                        <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-2">
                        <span>TOTAL</span>
                        <span>₹{grandTotal.toFixed(2)}</span>
                    </div>
                </div>

                {order.payments && order.payments.length > 0 && (
                    <div className="space-y-1 mb-4 border-b border-dashed border-black pb-4">
                        <p className="font-bold underline mb-1">Payments:</p>
                        {order.payments.map(p => (
                            <div key={p.id} className="flex justify-between text-xs">
                                <span>{p.method}</span>
                                <span>₹{Number(p.amount).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="space-y-1">
                    <div className="flex justify-between">
                        <span>Total Paid:</span>
                        <span>₹{totalPaid.toFixed(2)}</span>
                    </div>
                    {remaining > 0 ? (
                        <div className="flex justify-between font-bold">
                            <span>Remaining:</span>
                            <span>₹{remaining.toFixed(2)}</span>
                        </div>
                    ) : (
                        <div className="flex justify-between font-bold">
                            <span>Change:</span>
                            <span>₹{change.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                <div className="text-center mt-8 text-xs">
                    <p>Thank you for dining with us!</p>
                </div>
            </div>
        </div>
    );
});
Receipt.displayName = "Receipt";
