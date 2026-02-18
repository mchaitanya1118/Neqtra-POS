"use client";

import { useCartStore } from "@/store/useCartStore";
import { useShallow } from 'zustand/react/shallow';
import { useTableStore } from "@/store/useTableStore";
import { useAuthStore } from "@/store/useAuthStore";
import {
    Trash2,
    User,
    Users,
    ChevronUp,
    ChevronDown,
    RefreshCw,
    Printer,
    AlertCircle,
    Clock,
    Percent,
    DollarSign,
    UserPlus,
    X,
    CreditCard,
    Wallet,
    Smartphone,
    History,
    Receipt as ReceiptIcon,
    RotateCw,
    Truck
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from "next/navigation";

const Receipt = dynamic(() => import("./Receipt").then(mod => mod.Receipt), { ssr: false });
const SplitBillModal = dynamic(() => import("./SplitBillModal").then(mod => mod.SplitBillModal), { ssr: false });
const CustomerModal = dynamic(() => import("./CustomerModal").then(mod => mod.CustomerModal), { ssr: false });
const KOTPreviewModal = dynamic(() => import("./KOTPreviewModal").then(mod => mod.KOTPreviewModal), { ssr: false });
const TableSelectionModal = dynamic(() => import("./TableSelectionModal").then(mod => mod.TableSelectionModal), { ssr: false });

interface ActiveOrder {
    id: number;
    tableName: string;
    totalAmount: number;
    items: any[];
    createdAt: string;
    status: string;
    payments?: any[];
    discount?: number;
    discountType?: 'FIXED' | 'PERCENT';
    customerId?: number;
    customer?: { name: string; phone: string };
    discountVal?: number;
}

export function BillingPanel() {
    const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
    const selectedTable = useTableStore(state =>
        Array.isArray(state.tables) && state.selectedTableId
            ? state.tables.find(t => t.id === state.selectedTableId)
            : undefined
    );
    const { updateStatus, selectTable, fetchTables } = useTableStore(useShallow(state => ({
        updateStatus: state.updateStatus,
        selectTable: state.selectTable,
        fetchTables: state.fetchTables
    })));
    const { user, hasPermission } = useAuthStore();
    const router = useRouter();

    const [isTableModalOpen, setIsTableModalOpen] = useState(false);
    const [tableModalMode, setTableModalMode] = useState<'SELECT' | 'SHIFT'>('SELECT');

    const [paymentMode, setPaymentMode] = useState<'Cash' | 'Card' | 'Online' | 'Due'>('Cash');
    const [isProcessing, setIsProcessing] = useState(false);

    const [isSplitOpen, setIsSplitOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isKOTOpen, setIsKOTOpen] = useState(false);
    const [kotOrder, setKotOrder] = useState<any>(null);

    const [existingOrder, setExistingOrder] = useState<ActiveOrder | null>(null);
    const [paymentTxnId, setPaymentTxnId] = useState<string | null>(null);

    const [customer, setCustomer] = useState<any>(null);
    const [discount, setDiscount] = useState<string>("");
    const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');

    const receiptRef = useRef<HTMLDivElement>(null);
    const [lastOrder, setLastOrder] = useState<any>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchActiveOrder = async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        if (!selectedTable) {
            setExistingOrder(null);
            setCustomer(null);
            setDiscount("");
            setDiscountType('FIXED');
            return;
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const res = await fetch(`${API_URL}/orders/${selectedTable.id}/active`, {
                signal: controller.signal
            });

            if (res.ok) {
                const data = await res.json();
                setExistingOrder(data);
                if (data.customer) setCustomer(data.customer);
                else setCustomer(null);

                if (data.discount) {
                    setDiscount(data.discount.toString());
                    setDiscountType(data.discountType || 'FIXED');
                } else {
                    setDiscount("");
                }
            } else {
                setExistingOrder(null);
                setCustomer(null);
                setDiscount("");
                setDiscountType('FIXED');
            }
        } catch (e: any) {
            if (e.name === 'AbortError') return;
            setExistingOrder(null);
        } finally {
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null;
            }
        }
    };

    // -- Delivery Mode Logic --
    const searchParams = useSearchParams();
    const isDeliveryMode = searchParams.get('type') === 'delivery';
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryDriver, setDeliveryDriver] = useState("");

    useEffect(() => {
        if (!isDeliveryMode) {
            fetchActiveOrder();
        } else {
            // In delivery mode, we don't fetch active order by table. 
            // We start fresh or maybe we need to handle "Active Delivery" if we were editing one? 
            // For now, let's assume New Delivery flow.
            setExistingOrder(null);
            useTableStore.getState().selectTable(null);
        }
    }, [selectedTable, isDeliveryMode]);

    const cartTotal = getTotal();
    const existingSubTotal = existingOrder ? Number(existingOrder.totalAmount) : 0;
    const combinedSubTotal = cartTotal + existingSubTotal;

    const discountNum = parseFloat(discount) || 0;
    let discountVal = 0;
    if (discountType === 'PERCENT') {
        discountVal = combinedSubTotal * (discountNum / 100);
    } else {
        discountVal = discountNum;
    }

    const grandTotal = Math.max(0, combinedSubTotal - discountVal);
    const paidAmount = existingOrder?.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
    const remainingDue = grandTotal - paidAmount;

    const handlePrint = (orderData: any) => {
        setLastOrder(orderData);
        setTimeout(() => {
            if (receiptRef.current) {
                const printContent = receiptRef.current.innerHTML;
                const win = window.open('', '', 'height=600,width=400');
                if (win) {
                    win.document.write('<html><head><title>Receipt</title>');
                    win.document.write('<script src="https://cdn.tailwindcss.com"></script>');
                    win.document.write('</head><body>');
                    win.document.write(printContent);
                    win.document.write('</body></html>');
                    win.document.close();
                    setTimeout(() => win.print(), 500);
                }
            }
        }, 100);
    };

    const handleShiftTable = async (targetTableId: number) => {
        if (!selectedTable) {
            alert("No station selected to move from.");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch(`${API_URL}/tables/shift`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fromId: selectedTable.id, toId: targetTableId })
            });

            if (res.ok) {
                alert("Station successfully shifted.");
                selectTable(targetTableId);
                fetchActiveOrder();
                fetchTables();
            } else {
                const err = await res.json();
                alert(`Shift Failed: ${err.message}`);
            }
        } catch (e: any) {
            console.error(e);
            alert(`Link Error: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAction = async (action: 'SAVE' | 'PRINT' | 'KOT' | 'SETTLE') => {
        const hasChanges = items.length > 0 ||
            (customer?.id !== existingOrder?.customerId) ||
            (parseFloat(discount || "0") !== Number(existingOrder?.discount || 0)) ||
            (discountType !== (existingOrder?.discountType || 'FIXED'));

        if (!hasChanges && !existingOrder) {
            alert("No transaction detected.");
            return;
        }

        if (!selectedTable && !isDeliveryMode) {
            alert("Table registry not selected.");
            return;
        }

        if (isDeliveryMode) {
            if (!customer) {
                alert("Customer is required for Delivery.");
                setIsCustomerModalOpen(true);
                return;
            }
            if (!deliveryAddress.trim()) {
                alert("Delivery Address is required.");
                return;
            }
        }

        setIsProcessing(true);
        try {
            let currentOrder = existingOrder;
            if (hasChanges || isDeliveryMode) { // Delivery always creates new if not existing
                const orderPayload: any = {
                    items: items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
                    status: 'PENDING',
                    customerId: customer?.id,
                    discount: parseFloat(discount) || 0,
                    discountType
                };

                if (isDeliveryMode) {
                    orderPayload.type = 'DELIVERY';
                    orderPayload.deliveryDetails = {
                        address: deliveryAddress,
                        driverName: deliveryDriver || undefined
                    };
                } else {
                    orderPayload.type = 'DINE_IN';
                    orderPayload.tableId = selectedTable?.id;
                    orderPayload.tableName = selectedTable?.label;
                }

                const res = await fetch(`${API_URL}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderPayload)
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || `Save failed: ${res.statusText}`);
                }
                currentOrder = await res.json();
            }

            if (action === 'SETTLE' && currentOrder) {
                if (paymentMode === 'Due' && !customer) {
                    alert("Customer focus required for Dues.");
                    setIsCustomerModalOpen(true);
                    return;
                }

                const settleRes = await fetch(`${API_URL}/orders/${currentOrder.id}/settle`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: remainingDue, method: paymentMode.toUpperCase() })
                });

                if (settleRes.ok) {
                    const settleData = await settleRes.json();
                    if (settleData.status === 'COMPLETED') {
                        alert("Transaction Synchronized. Table Freed.");
                        currentOrder = null;
                        clearCart();
                        setCustomer(null);
                        setDiscount("");
                        if (isDeliveryMode) {
                            router.push('/delivery'); // Redirect back to delivery dashboard
                        }
                    } else {
                        alert("Partial Payment Authenticated");
                    }
                }
            } else if (action === 'SAVE' && currentOrder) {
                if (isDeliveryMode) {
                    alert("Delivery Order Created!");
                    router.push('/delivery');
                } else {
                    setKotOrder(currentOrder);
                    setIsKOTOpen(true);
                    clearCart();
                }
            }

            if (action === 'PRINT' && currentOrder) {
                handlePrint(currentOrder);
            }

            if (selectedTable && currentOrder && !isDeliveryMode) updateStatus(selectedTable.id, 'OCCUPIED');
            if (!isDeliveryMode) fetchActiveOrder();

        } catch (e: any) {
            console.error(e);
            alert(`Link Error: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-surface-dark relative">

            {/* Header: Table / Customer Glass Pannel */}
            <div className="bg-surface/40 backdrop-blur-md border-b border-surface-light p-6 space-y-4">
                <div className="flex items-center justify-between">
                    {isDeliveryMode ? (
                        <div className="flex-1 mr-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-primary" />
                                <span className="text-sm font-bold text-primary uppercase tracking-widest">Delivery Mode</span>
                            </div>
                            <input
                                className="w-full bg-surface-light/50 border border-surface-light rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50"
                                placeholder="Delivery Address *"
                                value={deliveryAddress}
                                onChange={e => setDeliveryAddress(e.target.value)}
                            />
                            <input
                                className="w-full bg-surface-light/50 border border-surface-light rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50"
                                placeholder="Driver Name (Optional)"
                                value={deliveryDriver}
                                onChange={e => setDeliveryDriver(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div
                            className="flex flex-col cursor-pointer group"
                            onClick={() => { setTableModalMode('SELECT'); setIsTableModalOpen(true); }}
                        >
                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest group-hover:text-primary transition-colors">Station</span>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-bold font-serif italic tracking-tighter text-foreground group-hover:translate-x-1 transition-transform">{selectedTable?.label || '--'}</span>
                                <ChevronDown className="w-5 h-5 text-muted opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                        </div>
                    )}

                    {!isDeliveryMode && (
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Grand Pattern</span>
                            <div className="text-3xl font-bold text-primary tracking-tighter">₹{Math.round(grandTotal)}</div>
                        </div>
                    )}
                    {isDeliveryMode && (
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Total</span>
                            <div className="text-3xl font-bold text-primary tracking-tighter">₹{Math.round(grandTotal)}</div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setIsCustomerModalOpen(true)}
                        className={cn(
                            "flex-1 flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300",
                            customer ? "bg-primary/10 border-primary/30 text-foreground" : "bg-background/40 border-surface-light text-muted hover:border-muted/50"
                        )}
                    >
                        <User className={cn("w-4 h-4", customer ? "text-primary" : "text-muted")} />
                        <span className="text-xs font-bold truncate max-w-[120px]">{customer?.name || 'Assign Customer'}</span>
                        {customer && <X className="w-3 h-3 ml-auto text-muted hover:text-destructive" onClick={(e) => { e.stopPropagation(); setCustomer(null); }} />}
                    </button>

                    <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-background/40 border border-surface-light">
                        <Users className="w-4 h-4 text-muted" />
                        <span className="text-xs font-bold text-muted uppercase tracking-wider">{user?.name || 'Staff'}</span>
                    </div>
                </div>
            </div>

            {/* Cart Grid Headers */}
            <div className="bg-surface-light/50 py-3 px-6 flex text-[9px] font-bold text-muted uppercase tracking-[0.2em] border-b border-surface-light shrink-0">
                <div className="flex-[2]">Registry Items</div>
                <div className="flex-1 text-center">Qty</div>
                <div className="flex-1 text-right">Value</div>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto bg-transparent custom-scrollbar">
                <AnimatePresence>
                    {items.length === 0 && !existingOrder ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="h-96 flex flex-col items-center justify-center text-center p-8 text-muted/40"
                        >
                            <History className="w-12 h-12 mb-6 opacity-20" />
                            <p className="font-bold text-[10px] uppercase tracking-[0.3em]">No Active Patterns</p>
                        </motion.div>
                    ) : (
                        <div className="divide-y divide-surface-light/30">
                            {existingOrder?.items?.map((item: any, idx: number) => (
                                <div key={`existing-${idx}`} className="py-5 px-6 flex items-center bg-background/20 opacity-60">
                                    <div className="flex-[2] text-sm font-bold text-muted">
                                        {item.menuItem?.title}
                                        <span className="text-[9px] ml-3 border border-muted/30 px-2 py-0.5 rounded-full text-muted tracking-widest">LINKED</span>
                                    </div>
                                    <div className="flex-1 text-center text-sm font-bold text-muted">{item.quantity}</div>
                                    <div className="flex-1 text-right text-sm font-bold text-muted">₹{Number(item.menuItem?.price) * item.quantity}</div>
                                </div>
                            ))}

                            {items.map((item) => (
                                <motion.div
                                    layout
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    key={item.menuItemId}
                                    className="py-5 px-6 flex items-center hover:bg-surface-light/20 group transition-all"
                                >
                                    <div className="flex-[2]">
                                        <h4 className="text-sm font-bold text-foreground mb-0.5">{item.title}</h4>
                                        <span className="text-[9px] text-primary font-bold uppercase tracking-widest">New Sync</span>
                                    </div>

                                    <div className="flex-1 flex items-center justify-center gap-4">
                                        <button onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)} className="text-muted hover:text-red-400 transition-colors">
                                            <ChevronDown className="w-5 h-5" />
                                        </button>
                                        <span className="font-bold text-base text-foreground w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)} className="text-muted hover:text-primary transition-colors">
                                            <ChevronUp className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex-1 text-right text-sm font-bold text-foreground">
                                        ₹{item.price * item.quantity}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Actions Area */}
            <div className="bg-surface/80 backdrop-blur-3xl border-t border-surface-light shrink-0 p-6 space-y-6">

                {/* Discount & Math */}
                <div className="flex items-center gap-4 bg-background/40 rounded-3xl border border-surface-light p-2 pr-6">
                    <div className="flex bg-surface-light rounded-2xl overflow-hidden p-1 gap-1">
                        <button
                            onClick={() => setDiscountType('FIXED')}
                            className={cn("w-10 h-10 flex items-center justify-center rounded-xl text-xs font-bold transition-all", discountType === 'FIXED' ? "bg-primary text-primary-fg shadow-lg shadow-primary/20" : "text-muted hover:text-foreground")}
                        >
                            <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setDiscountType('PERCENT')}
                            className={cn("w-10 h-10 flex items-center justify-center rounded-xl text-xs font-bold transition-all", discountType === 'PERCENT' ? "bg-primary text-primary-fg shadow-lg shadow-primary/20" : "text-muted hover:text-foreground")}
                        >
                            <Percent className="w-4 h-4" />
                        </button>
                    </div>
                    <input
                        className="flex-1 bg-transparent text-sm font-bold text-foreground placeholder:text-muted/30 focus:outline-none px-2"
                        placeholder="Discount Entry..."
                        value={discount}
                        onChange={e => setDiscount(e.target.value)}
                    />
                    <div className="text-right">
                        <span className="text-[9px] font-bold text-muted uppercase tracking-widest block mb-0.5">Deduction</span>
                        <span className="font-bold text-primary">₹{Math.round(discountVal)}</span>
                    </div>
                </div>

                {/* Totals & Payments */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <div className="flex gap-4">
                            <button onClick={() => setIsSplitOpen(true)} className="flex items-center gap-2 text-[10px] font-bold text-muted hover:text-foreground uppercase tracking-[0.2em] transition-colors">
                                <RotateCw className="w-3.5 h-3.5" />
                                Split Path
                            </button>
                            <button onClick={() => clearCart()} className="flex items-center gap-2 text-[10px] font-bold text-muted hover:text-red-400 uppercase tracking-[0.2em] transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                                Flush
                            </button>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Registry Sync</span>
                            <span className="text-xl font-bold tracking-tighter">₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { id: 'Cash', icon: Wallet },
                            { id: 'Card', icon: CreditCard },
                            { id: 'Online', icon: Smartphone },
                            { id: 'Due', icon: AlertCircle }
                        ].map(({ id, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => {
                                    if (id === 'Due' && (!customer || !hasPermission('Dues'))) {
                                        if (!customer) alert("Select customer first.");
                                        else alert("Insufficient permissions for Dues.");
                                        return;
                                    }
                                    setPaymentMode(id as any);
                                }}
                                className={cn(
                                    "flex flex-col items-center justify-center py-4 rounded-3xl border transition-all duration-300 gap-2",
                                    paymentMode === id
                                        ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10 scale-[1.02]"
                                        : "bg-background/40 border-surface-light text-muted hover:border-muted/50"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">{id}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Primary Actions */}
                <div className="grid grid-cols-12 gap-3 pt-2">
                    <button
                        onClick={() => handleAction('SAVE')}
                        disabled={isProcessing || items.length === 0 || !hasPermission('Orders')}
                        className="col-span-8 py-5 bg-primary hover:bg-primary/90 disabled:opacity-30 text-primary-fg rounded-[32px] font-bold text-sm shadow-[0_10px_30px_rgba(105,215,189,0.3)] transition-all uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {existingOrder ? 'Sync Registry' : 'Place Pattern'}
                    </button>

                    <button
                        onClick={() => handleAction('PRINT')}
                        disabled={isProcessing || !existingOrder || !hasPermission('Billing')}
                        className="col-span-4 py-3 bg-surface-light hover:bg-surface text-foreground rounded-[32px] flex items-center justify-center border border-surface-light transition-all hover:scale-[1.05] active:scale-95"
                    >
                        <Printer className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => handleAction('SETTLE')}
                        disabled={isProcessing || !existingOrder || !hasPermission('Billing')}
                        className="col-span-full py-5 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30 rounded-[32px] font-bold text-sm transition-all uppercase tracking-[0.4em] transform hover:scale-[1.01] active:scale-[0.99] shadow-2xl"
                    >
                        {paymentTxnId ? 'Verify System Status' : 'Settle Registry Ledger'}
                    </button>
                </div>
            </div>

            <div className="hidden">
                <Receipt ref={receiptRef} order={lastOrder} />
            </div>

            <TableSelectionModal
                isOpen={isTableModalOpen}
                onClose={() => setIsTableModalOpen(false)}
                onSelect={(id) => {
                    if (tableModalMode === 'SHIFT') handleShiftTable(id);
                    else selectTable(id);
                    setIsTableModalOpen(false);
                }}
                title={tableModalMode === 'SHIFT' ? "Shift to Station" : "Select Station"}
                filter={tableModalMode === 'SHIFT' ? 'FREE' : 'ALL'}
                currentTableId={selectedTable?.id}
            />

            <SplitBillModal
                isOpen={isSplitOpen}
                onClose={() => setIsSplitOpen(false)}
                tableId={selectedTable?.id || 0}
                onSuccess={() => {
                    fetchTables();
                    fetchActiveOrder();
                }}
            />

            <CustomerModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onSelect={setCustomer}
            />

            <KOTPreviewModal
                isOpen={isKOTOpen}
                onClose={() => setIsKOTOpen(false)}
                order={kotOrder}
                onPrint={() => {
                    handlePrint(kotOrder);
                    setIsKOTOpen(false);
                }}
            />
        </div>
    );
}
