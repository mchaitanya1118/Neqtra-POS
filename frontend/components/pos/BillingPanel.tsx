"use client";

import { useCartStore } from "@/store/useCartStore";
import { useShallow } from 'zustand/react/shallow';
import { useTableStore } from "@/store/useTableStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Trash2, User, Users, ChevronUp, ChevronDown, RefreshCw, Printer, AlertCircle, Clock, Percent, DollarSign, UserPlus, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";

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
    // Derived
    discountVal?: number;
}

export function BillingPanel() {
    const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
    // Use explicit selector for reactivity
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
    const { user } = useAuthStore();

    // Table Selection & Shifting (Declared inside component)
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);
    const [tableModalMode, setTableModalMode] = useState<'SELECT' | 'SHIFT'>('SELECT');

    const [paymentMode, setPaymentMode] = useState<'Cash' | 'Card' | 'Online' | 'Due' | 'Other' | 'Part'>('Cash');
    const [activeTab, setActiveTab] = useState<'Dine In' | 'Delivery' | 'Pick Up'>('Dine In');
    const [isProcessing, setIsProcessing] = useState(false);
    const [itsPaid, setItsPaid] = useState(false);

    // Modals
    const [isSplitOpen, setIsSplitOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isKOTOpen, setIsKOTOpen] = useState(false);
    const [kotOrder, setKotOrder] = useState<any>(null);

    // Active Order State
    const [existingOrder, setExistingOrder] = useState<ActiveOrder | null>(null);

    // Payment State
    const [paymentTxnId, setPaymentTxnId] = useState<string | null>(null);



    // Local Edit State (Discount / Customer)
    const [customer, setCustomer] = useState<any>(null);
    const [discount, setDiscount] = useState<string>("");
    const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');

    // For Printing
    const receiptRef = useRef<HTMLDivElement>(null);
    const [lastOrder, setLastOrder] = useState<any>(null);

    // Fetch active order when table changes
    const fetchActiveOrder = async () => {
        console.log(`[BillingPanel] Fetching active order for table:`, selectedTable);
        if (!selectedTable) {
            setExistingOrder(null);
            setCustomer(null);
            setDiscount("");
            setDiscountType('FIXED');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/orders/${selectedTable.id}/active`);
            if (res.ok) {
                const data = await res.json();
                setExistingOrder(data);

                // Sync Local State with Active Order
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
        } catch (e) {
            console.error("Failed to fetch active order", e);
            setExistingOrder(null);
        }
    };

    useEffect(() => {
        fetchActiveOrder();
    }, [selectedTable]);

    // --- Totals Calculation ---
    const cartTotal = getTotal();
    const existingSubTotal = existingOrder ? Number(existingOrder.totalAmount) : 0;
    const combinedSubTotal = cartTotal + existingSubTotal;

    // Calculate Discount Amount
    const discountNum = parseFloat(discount) || 0;
    let discountVal = 0;
    if (discountType === 'PERCENT') {
        discountVal = combinedSubTotal * (discountNum / 100);
    } else {
        discountVal = discountNum;
    }

    const taxableAmount = Math.max(0, combinedSubTotal - discountVal);
    // Tax is included in price or 0 as per user request
    const tax = 0;
    const grandTotal = taxableAmount;

    // Paid amount for display if partial
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
        console.log(`[BillingPanel] Attempting to shift to table ID: ${targetTableId}`);
        if (!existingOrder) {
            console.error("[BillingPanel] No existing order to shift");
            return;
        }

        try {
            console.log(`[BillingPanel] Calling move API for order ${existingOrder.id}`);
            const res = await fetch(`${API_URL}/orders/${existingOrder.id}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetTableId })
            });

            if (res.ok) {
                const data = await res.json();
                console.log("[BillingPanel] Move successful:", data);
                // Refresh tables and select the new one
                await fetchTables();
                selectTable(targetTableId);
                setIsTableModalOpen(false);
                alert("Table shifted successfully!");
            } else {
                const err = await res.json();
                console.error("[BillingPanel] Move failed:", err);
                alert(`Failed to shift table: ${err.message}`);
            }
        } catch (e) {
            console.error("[BillingPanel] Network error:", e);
            alert("Network error shifting table");
        }
    };

    const handleAction = async (action: 'SAVE' | 'PRINT' | 'KOT' | 'KOT_PRINT' | 'EBILL' | 'SETTLE') => {
        // Validation
        const hasChanges = items.length > 0 ||
            (customer?.id !== existingOrder?.customerId) ||
            (parseFloat(discount || "0") !== Number(existingOrder?.discount || 0));

        if (!hasChanges && !existingOrder) {
            alert("Nothing to process! Cart is empty.");
            return;
        }

        if (!selectedTable && activeTab === 'Dine In') {
            alert("Please select a table first!");
            return;
        }

        setIsProcessing(true);
        try {
            let currentOrder = existingOrder;

            // 1. Create/Update Order if there are changes (Items OR Discount OR Customer)
            if (hasChanges) {
                const orderPayload = {
                    items: items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
                    tableId: selectedTable?.id,
                    tableName: selectedTable?.label,
                    type: activeTab.toUpperCase().replace(" ", "_"),
                    status: 'PENDING',
                    // Always send current UI state for these fields
                    customerId: customer?.id,
                    discount: parseFloat(discount) || 0,
                    discountType
                };

                const res = await fetch(`${API_URL}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderPayload)
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error("Order Save Failed:", errorText);
                    throw new Error(`Failed to save order: ${res.statusText} - ${errorText}`);
                }
                currentOrder = await res.json();
            }

            // 2. Handle Payment logic
            if ((action === 'SETTLE' || itsPaid) && currentOrder) {

                // ONLINE (PHONEPE) FLOW
                if (paymentMode === 'Online') {
                    // Check if we are already verifying a transaction
                    if (paymentTxnId) {
                        // Verify Status
                        const statusRes = await fetch(`${API_URL}/orders/${currentOrder.id}/phonepe-check-status`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ merchantTransactionId: paymentTxnId, amount: remainingDue })
                        });

                        if (!statusRes.ok) {
                            alert("Status Check Error");
                            return;
                        }

                        const statusData = await statusRes.json();
                        if (statusData.status === 'COMPLETED' || statusData.remaining === 0) {
                            alert("Payment Verified! Order Settled.");
                            setPaymentTxnId(null);
                            currentOrder = null;
                            clearCart();
                            setCustomer(null);
                            setDiscount("");
                            fetchActiveOrder();
                            return;
                        } else if (statusData.status === 'PENDING') {
                            alert("Payment is still pending. Please wait and try again.");
                            return;
                        } else {
                            if (confirm("Payment Failed or Not Processed. Retry?")) {
                                setPaymentTxnId(null);
                            }
                            return;
                        }
                    }

                    // Initiate Payment
                    const initRes = await fetch(`${API_URL}/orders/${currentOrder.id}/phonepe-init`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount: remainingDue })
                    });

                    if (!initRes.ok) {
                        const errText = await initRes.text();
                        console.error("PhonePe Init Failed:", errText);
                        alert(`Failed to initiate payment: ${errText}`);
                        setIsProcessing(false);
                        return;
                    }

                    const initData = await initRes.json();

                    if (initData.url) {
                        // Open Payment Page
                        window.open(initData.url, '_blank');
                        setPaymentTxnId(initData.merchantTransactionId);
                        alert("Payment Page Opened in New Tab. Please complete payment and click 'Verify Payment'.");
                    } else {
                        alert("Failed to get payment URL");
                    }

                    setIsProcessing(false);
                    return; // Stop here, wait for verification
                }

                // NORMAL SETTLE FLOW
                const settleRes = await fetch(`${API_URL}/orders/${currentOrder.id}/settle`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: remainingDue, method: paymentMode.toUpperCase() })
                });

                if (!settleRes.ok) {
                    const errText = await settleRes.text();
                    console.error("Payment Failed:", errText);
                    alert(`Order saved but payment failed: ${errText}`);
                } else {
                    const settleData = await settleRes.json();
                    if (settleData.status === 'COMPLETED') {
                        alert("Bill Settled & Table Freed!");
                        currentOrder = null; // Clear view
                        clearCart();
                        setCustomer(null);
                        setDiscount("");
                    } else {
                        alert("Partial Payment Recorded");
                    }
                }
            } else if (action === 'SAVE' && currentOrder) {
                // Determine items for KOT (all items for new order, or just show all for simplicity as requested)
                // Open KOT Confirmation
                setKotOrder(currentOrder);
                setIsKOTOpen(true);
                // Do NOT clear cart yet, wait for print confirm? 
                // Or clear cart because order is saved?
                // Ideally, safety says clear cart after save.
                // KOT uses 'currentOrder' (saved state) so cart isn't needed for display.
                // But if user cancels print? The order IS saved.
                // So we usually clear cart here.
                clearCart();
                // We keep 'currentOrder' in 'kotOrder' state for the modal.
            }

            // 3. Handle Print (Bill Print)
            if ((action === 'PRINT') && currentOrder) {
                handlePrint(currentOrder);
            }

            if (selectedTable && currentOrder) updateStatus(selectedTable.id, 'OCCUPIED');

            fetchActiveOrder();
            setItsPaid(false);

        } catch (e: any) {
            console.error(e);
            alert(`Error processing request: ${e.message || e}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative">
            {/* DEBUG OVERLAY */}
            <div className="bg-red-900 text-white text-[10px] p-1 font-mono z-[100]">
                DEBUG: TableID={useTableStore.getState().selectedTableId},
                SelTable={selectedTable?.label || 'NULL'},
                TablesCount={useTableStore.getState().tables?.length},
                HasOrder={existingOrder ? 'YES' : 'NO'}
            </div>

            {/* Header / Tabs */}
            <div className="flex bg-[#333] text-white font-bold text-sm tracking-wide shrink-0">
                <button
                    onClick={() => setActiveTab('Dine In')}
                    className={cn("flex-1 py-3 text-center transition-colors", activeTab === 'Dine In' ? "bg-[#d32f2f]" : "bg-[#4a4a4a]")}
                >
                    Dine In
                </button>
                <button
                    onClick={() => setActiveTab('Delivery')}
                    className={cn("flex-1 py-3 text-center transition-colors border-l border-gray-600", activeTab === 'Delivery' ? "bg-[#d32f2f]" : "bg-[#4a4a4a]")}
                >
                    Delivery
                </button>
                <button
                    onClick={() => setActiveTab('Pick Up')}
                    className={cn("flex-1 py-3 text-center transition-colors border-l border-gray-600", activeTab === 'Pick Up' ? "bg-[#d32f2f]" : "bg-[#4a4a4a]")}
                >
                    Pick Up
                </button>
            </div>

            {/* Info Bar */}
            <div className="bg-white dark:bg-[#252526] border-b border-gray-200 dark:border-gray-700 flex shrink-0">
                <div
                    className="flex-1 flex flex-col items-center justify-center py-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#333]"
                    onClick={() => { setTableModalMode('SELECT'); setIsTableModalOpen(true); }}
                    title="Click to Switch Table"
                >
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Table</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                    </div>
                    <span className="text-red-600 font-bold text-lg">{selectedTable?.label || '--'}</span>
                </div>

                {/* Customer Section */}
                <div
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="flex-[1.5] flex flex-col items-center justify-center py-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#333] relative group"
                >
                    {customer ? (
                        <>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Customer</span>
                            <span className="text-gray-800 dark:text-gray-200 font-bold text-sm truncate px-2">{customer.name}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setCustomer(null); }}
                                className="absolute top-1 right-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-1 text-gray-500">
                            <UserPlus className="w-4 h-4" />
                            <span className="text-xs font-semibold">Add Customer</span>
                        </div>
                    )}
                </div>

                {existingOrder && (
                    <div className="flex-1 flex flex-col items-center justify-center py-2 border-r border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/10">
                        <Clock className="w-4 h-4 text-yellow-600 mb-1" />
                        <span className="text-xs font-semibold text-yellow-600">#{existingOrder.id}</span>
                        <span className="text-[10px] text-yellow-800/70 font-mono">
                            {new Date(existingOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); setTableModalMode('SHIFT'); setIsTableModalOpen(true); }}
                            className="absolute top-1 right-1 p-1 hover:bg-yellow-100 rounded text-yellow-700 opacity-0 group-hover:opacity-100"
                            title="Shift Table"
                        >
                            <RefreshCw className="w-3 h-3" />
                        </button>
                    </div>
                )}
                <div className="flex-1 flex flex-col items-center justify-center py-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#333]">
                    <Users className="w-4 h-4 text-gray-500 mb-1" />
                    <span className="text-xs font-semibold">{user?.name || 'Staff'}</span>
                </div>
            </div>

            {/* Cart Table Headers */}
            <div className="bg-[#f3f4f6] dark:bg-[#333] py-2 px-3 flex text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600 shrink-0">
                <div className="flex-[2]">Items</div>
                <div className="flex-1 text-center">Qty.</div>
                <div className="flex-1 text-right">Price</div>
                <div className="w-6"></div>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#1e1e1e] relative">
                {items.length === 0 && !existingOrder ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4 p-4 text-center">
                        <div className="w-24 h-24 rounded-full border-4 border-gray-300 flex items-center justify-center">
                            <RefreshCw className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium">No Item Selected</p>

                        {/* Zombie Table Handler */}
                        {selectedTable?.status === 'OCCUPIED' && (
                            <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
                                <p className="text-xs font-bold mb-1">Table is marked OCCUPIED but has no active order.</p>
                                <button
                                    onClick={() => {
                                        if (confirm("Are you sure you want to force free this table?")) {
                                            updateStatus(selectedTable.id, 'FREE');
                                            fetchActiveOrder();
                                        }
                                    }}
                                    className="px-3 py-1 bg-yellow-600 text-white text-xs rounded shadow hover:bg-yellow-700"
                                >
                                    Force Free Table
                                </button>
                                <button onClick={fetchActiveOrder} className="ml-2 px-3 py-1 bg-gray-500 text-white text-xs rounded shadow hover:bg-gray-600">
                                    Refresh
                                </button>
                            </div>
                        )}
                        {!selectedTable && (
                            <div className="flex flex-col gap-2">
                                <p className="text-xs">Please Select a Table</p>
                                <button
                                    onClick={() => { setTableModalMode('SELECT'); setIsTableModalOpen(true); }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Select Table
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {/* Existing Items */}
                        {existingOrder?.items?.map((item: any, idx: number) => (
                            <div key={`existing-${idx}`} className="py-3 px-3 flex items-center bg-gray-50/50 dark:bg-white/5 opacity-80">
                                <div className="flex-[2] text-sm font-semibold text-gray-600 dark:text-gray-400">
                                    {item.menuItem?.title}
                                    <span className="text-[10px] ml-2 bg-gray-200 px-1 rounded text-gray-500">SENT</span>
                                </div>
                                <div className="flex-1 flex items-center justify-center gap-2">
                                    <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                                </div>
                                <div className="flex-1 text-right text-sm font-bold text-gray-600 dark:text-gray-400">
                                    {Number(item.menuItem?.price) * item.quantity}
                                </div>
                                <div className="w-6"></div>
                            </div>
                        ))}

                        {/* New Items */}
                        {items.length > 0 && existingOrder && (
                            <div className="py-1 px-3 bg-green-500/10 text-green-600 text-[10px] font-bold uppercase">New Items</div>
                        )}

                        {items.map((item) => (
                            <div key={item.menuItemId} className="py-3 px-3 flex items-center hover:bg-gray-50 dark:hover:bg-[#252526] group">
                                <div className="flex-[2] text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    {item.title}
                                </div>
                                <div className="flex-1 flex items-center justify-center gap-2">
                                    <button onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)} className="text-gray-400 hover:text-red-500 pt-1">
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                    <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)} className="text-gray-400 hover:text-green-500 pb-1">
                                        <ChevronUp className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex-1 text-right text-sm font-bold text-gray-800 dark:text-white">
                                    {item.price * item.quantity}
                                </div>
                                <div className="w-6 flex justify-center">
                                    <button onClick={() => removeItem(item.menuItemId)} className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="bg-[#333] text-white shrink-0">
                {/* Discount & Totals Row */}
                <div className="flex items-center justify-between border-b border-gray-600 bg-[#424242]">
                    <div className="flex items-center">
                        <div className="flex">
                            <button
                                onClick={() => setDiscountType('FIXED')}
                                className={cn("p-2 text-xs font-bold border-r border-gray-600 hover:bg-[#555]", discountType === 'FIXED' ? "bg-[#555] text-white" : "text-gray-400")}
                            >
                                <span className="text-lg">₹</span>
                            </button>
                            <button
                                onClick={() => setDiscountType('PERCENT')}
                                className={cn("p-2 text-xs font-bold border-r border-gray-600 hover:bg-[#555]", discountType === 'PERCENT' ? "bg-[#555] text-white" : "text-gray-400")}
                            >
                                <Percent className="w-3 h-3" />
                            </button>
                        </div>
                        <input
                            className="bg-transparent text-xs font-bold text-white placeholder:text-gray-500 p-2 w-20 focus:outline-none focus:bg-[#555]"
                            placeholder="Discount"
                            value={discount}
                            onChange={e => setDiscount(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-4 px-4 py-2">
                        {discountVal > 0 && (
                            <div className="text-xs text-green-400 font-bold">
                                - {Math.round(discountVal)}
                            </div>
                        )}
                        <div className="text-right">
                            <div className="text-[10px] text-gray-400 uppercase font-bold">Total</div>
                            <div className="text-xl font-bold leading-none">₹{grandTotal.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                {/* Sub-actions Row */}
                <div className="flex items-center border-b border-gray-600">
                    <button
                        onClick={() => {
                            if (!selectedTable) return alert("Select a table first");
                            setIsSplitOpen(true);
                        }}
                        className="px-4 py-2 bg-[#d32f2f] hover:bg-[#b71c1c] text-xs font-bold uppercase transition-colors"
                    >
                        Split Bill
                    </button>
                    <button
                        onClick={fetchActiveOrder}
                        className="px-4 py-2 bg-[#424242] hover:bg-[#616161] text-xs font-bold uppercase border-l border-gray-700 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                    <div className="ml-auto flex items-center gap-1 px-4 py-2 text-xs font-medium text-gray-400">
                        <span className="uppercase">Net Total (No Extra Tax)</span>
                    </div>
                </div>

                {/* Payment Modes */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#424242] text-xs font-bold uppercase">
                    {['Cash', 'Card', 'Online', 'Due', 'Other', 'Part'].map(mode => (
                        <label key={mode} className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                            <input
                                type="radio"
                                name="payment"
                                checked={paymentMode === mode}
                                onChange={e => setPaymentMode(mode as any)}
                                className="accent-white"
                            />
                            {mode}
                        </label>
                    ))}
                </div>

                {/* Additional Options */}
                <div className="flex items-center justify-between px-4 py-2 bg-[#333] text-[10px] text-gray-400 font-bold uppercase border-b border-gray-700">
                    <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={itsPaid}
                            onChange={e => setItsPaid(e.target.checked)}
                            className="accent-[#d32f2f]"
                        />
                        It's Paid
                    </label>
                    <label className="flex items-center gap-1"><input type="checkbox" defaultChecked /> Loyalty</label>
                    <label className="flex items-center gap-1"><input type="checkbox" /> Virtual Wallet</label>
                </div>

                {/* Footer Buttons */}
                <div className="p-2 grid grid-cols-4 gap-2 bg-white dark:bg-[#1e1e1e]">
                    {/* Place/Update Order */}
                    {/* Place/Update Order */}
                    {/* Always visible, disabled if no items/changes */
                        /* Logic: Disabled if (items empty AND existingOrder unchanged) OR isProcessing */
                        /* But wait, if items empty, Place Order is basically useless unless updating customer/discount. */
                        /* User request: "display... but dont active... untill the items are added" */
                        /* So, active ONLY if items > 0. (Maybe ignore customer/discount only updates for simplified UX or include them?) */
                        /* Let's include changes checking. */
                    }
                    {true && (
                        <button
                            onClick={() => handleAction('SAVE')}
                            disabled={isProcessing || !(items.length > 0 || (existingOrder && (parseFloat(discount) !== Number(existingOrder.discount) || customer?.id !== existingOrder.customerId)))}
                            className="col-span-2 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded font-bold text-sm shadow-sm transition-colors uppercase tracking-wide"
                        >
                            {existingOrder ? 'Update Order' : 'Place Order'}
                        </button>
                    )}

                    {/* Settle Bill logic: Always visible, disabled if no active order */}
                    {true && (
                        <button
                            onClick={() => {
                                if (!existingOrder && selectedTable?.status === 'OCCUPIED') {
                                    if (confirm("Force free this table?")) {
                                        updateStatus(selectedTable.id, 'FREE');
                                        fetchActiveOrder();
                                    }
                                    return;
                                }
                                handleAction('SETTLE')
                            }}
                            disabled={isProcessing || !existingOrder}
                            className="col-span-2 py-3 bg-[#d32f2f] hover:bg-[#b71c1c] disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded font-bold text-sm shadow-sm transition-colors uppercase tracking-wide"
                        >
                            {(!existingOrder && selectedTable?.status === 'OCCUPIED') ? 'Force Free' : (paymentTxnId ? 'Verify Payment' : 'Settle Bill')}
                        </button>
                    )}

                    {/* Printer */}
                    {existingOrder && (
                        <button
                            onClick={() => handleAction('PRINT')}
                            disabled={isProcessing}
                            className="col-span-1 py-3 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded font-bold text-sm shadow-sm transition-colors uppercase"
                        >
                            Print Bill
                        </button>
                    )}

                    {/* Empty spacer if buttons missing to keep layout */}


                    <div className="col-span-1 border border-dashed border-gray-400 rounded flex items-center justify-center">
                        <span className="text-[10px] text-gray-500 font-bold text-center px-2">KOT Auto-Triggers</span>
                    </div>
                </div>
            </div>

            <div className="hidden">
                <Receipt ref={receiptRef} order={lastOrder} />
            </div>

            {selectedTable && (
                <SplitBillModal
                    isOpen={isSplitOpen}
                    onClose={() => setIsSplitOpen(false)}
                    tableId={selectedTable.id}
                    onSuccess={() => {
                        alert("Split successful");
                        setIsSplitOpen(false);
                        fetchActiveOrder();
                    }}
                />
            )}

            <CustomerModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onSelect={(c) => setCustomer(c)}
            />

            <KOTPreviewModal
                isOpen={isKOTOpen}
                onClose={() => setIsKOTOpen(false)}
                order={kotOrder}
                tableLabel={selectedTable?.label}
                onPrint={() => {
                    // Actual Logic to Print KOT
                    // For now, browser print via a hidden window similar to Receipt, 
                    // or just alert "Printed". 
                    // Reusing handlePrint logic but for KOT content?
                    // Let's create a specialized KOT print function or reuse the modal content.

                    const printContent = `
                        <div style="font-family: monospace; padding: 20px; width: 300px;">
                            <h2 style="text-align: center; margin-bottom: 5px;">KOT</h2>
                            <p style="text-align: center; margin: 0;">Table: ${selectedTable?.label || kotOrder?.tableName}</p>
                            <p style="text-align: center; margin: 0; font-size: 12px;">Ord: #${kotOrder?.id}</p>
                            <hr style="border-top: 1px dashed black; margin: 10px 0;" />
                            ${kotOrder?.items?.map((i: any) =>
                        `<div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-bottom: 5px;">
                                    <span>${i.menuItem?.title || i.title}</span>
                                    <span>x${i.quantity}</span>
                                </div>`
                    ).join('')}
                        </div>
                    `;

                    const win = window.open('', '', 'height=600,width=400');
                    if (win) {
                        win.document.write(printContent);
                        win.document.close();
                        setTimeout(() => {
                            win.print();
                            win.close();
                            setIsKOTOpen(false); // Close modal after print initiated
                        }, 500);
                    }
                }}
            />

            <TableSelectionModal
                isOpen={isTableModalOpen}
                onClose={() => setIsTableModalOpen(false)}
                onSelect={(id) => {
                    if (tableModalMode === 'SELECT') {
                        selectTable(id);
                        setIsTableModalOpen(false);
                    } else {
                        handleShiftTable(id);
                    }
                }}
                filter={tableModalMode === 'SHIFT' ? 'FREE' : 'ALL'}
                title={tableModalMode === 'SHIFT' ? 'Move Order to...' : 'Switch Table'}
                currentTableId={selectedTable?.id}
            />
        </div>
    );
}
