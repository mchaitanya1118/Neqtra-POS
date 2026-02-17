"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Wallet, DollarSign, HandCoins, MoreVertical, Edit, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";

interface Customer {
    id: number;
    name: string;
    phone: string;
    totalDue: number;
    credit: number;
}

export default function DuesPage() {
    const { hasPermission } = useAuthStore();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [actionType, setActionType] = useState<"SETTLE" | "ADD_DUE" | null>(null);

    // Forms
    const [formData, setFormData] = useState({ name: "", phone: "", totalDue: "0" });
    const [amount, setAmount] = useState("");

    // History
    const [history, setHistory] = useState<{ id: string, type: string, amount: number, date: string, description: string }[]>([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // UI State
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/customers`);
            const data = await res.json();
            setCustomers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    totalDue: Number(formData.totalDue)
                })
            });
            if (res.ok) {
                fetchCustomers();
                setIsAddModalOpen(false);
                setFormData({ name: "", phone: "", totalDue: "0" });
            }
        } catch (e) { console.error(e); }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer) return;
        try {
            const res = await fetch(`${API_URL}/customers/${selectedCustomer.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone
                })
            });
            if (res.ok) {
                fetchCustomers();
                setIsEditModalOpen(false);
                setSelectedCustomer(null);
            }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async () => {
        if (!selectedCustomer) return;
        try {
            const res = await fetch(`${API_URL}/customers/${selectedCustomer.id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchCustomers();
                setIsDeleteModalOpen(false);
                setSelectedCustomer(null);
            }
        } catch (e) { console.error(e); }
    };

    const handleTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer || !actionType) return;

        const endpoint = actionType === "SETTLE" ? "settle" : "add-due";
        try {
            const res = await fetch(`${API_URL}/customers/${selectedCustomer.id}/${endpoint}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: Number(amount) })
            });
            if (res.ok) {
                fetchCustomers();
                setSelectedCustomer(null);
                setActionType(null);
                setAmount("");
            }
        } catch (e) { console.error(e); }
    };

    const handleViewHistory = async (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsHistoryModalOpen(true);
        setActiveMenu(null);
        try {
            const res = await fetch(`${API_URL}/customers/${customer.id}/history`);
            if (res.ok) {
                setHistory(await res.json());
            }
        } catch (e) { console.error(e); }
    };

    const openEditModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setFormData({ name: customer.name, phone: customer.phone, totalDue: customer.totalDue.toString() });
        setIsEditModalOpen(true);
        setActiveMenu(null);
    };

    const openDeleteModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDeleteModalOpen(true);
        setActiveMenu(null);
    };

    const setFullDue = () => {
        if (selectedCustomer) setAmount(selectedCustomer.totalDue.toString());
    }

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 relative min-h-screen" onClick={() => setActiveMenu(null)}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight font-serif italic">Dues Management</h1>
                    <p className="text-muted text-sm mt-2">Track customer debts, credits, and settlements</p>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsAddModalOpen(true); }}
                    disabled={!hasPermission('Dues')}
                    className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-fg px-6 py-3 rounded-full text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Add Customer
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 bg-surface/50 backdrop-blur-sm p-4 rounded-3xl border border-surface-light w-full md:w-fit shadow-sm">
                <Search className="w-5 h-5 text-muted" />
                <input
                    className="bg-transparent text-sm focus:outline-none w-full md:w-80 placeholder:text-muted/50"
                    placeholder="Search customers by name or phone..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-48 bg-surface/20 animate-pulse rounded-[32px]" />)
                ) : filteredCustomers.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-20 h-20 bg-surface-light/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-muted" />
                        </div>
                        <p className="text-muted font-medium">No customers found.</p>
                    </div>
                ) : (
                    filteredCustomers.map(c => (
                        <div key={c.id}
                            className={cn(
                                "group relative bg-surface border rounded-[32px] p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                                c.totalDue > 0 ? "border-red-500/20" : c.credit > 0 ? "border-green-500/20" : "border-surface-light"
                            )}
                        >
                            {/* Card Header & Menu */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl",
                                        c.totalDue > 0 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                                    )}>
                                        {c.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">{c.name}</h3>
                                        <p className="text-sm text-muted font-mono mt-0.5">{c.phone}</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === c.id ? null : c.id); }}
                                        className="p-2 hover:bg-surface-light rounded-full text-muted hover:text-foreground transition-colors"
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {activeMenu === c.id && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-xl shadow-xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            <button
                                                onClick={() => openEditModal(c)}
                                                disabled={!hasPermission('Dues')}
                                                className="w-full text-left px-4 py-3 text-sm hover:bg-surface-light disabled:opacity-30 flex items-center gap-2"
                                            >
                                                <Edit className="w-4 h-4" /> Edit Details
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(c)}
                                                disabled={!hasPermission('Dues')}
                                                className="w-full text-left px-4 py-3 text-sm hover:bg-red-500/10 disabled:opacity-30 text-red-500 flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="bg-background/50 rounded-2xl p-4 mb-6 flex justify-between items-center border border-surface-light/50">
                                <div>
                                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Due</p>
                                    <p className={cn("text-2xl font-bold tracking-tight", c.totalDue > 0 ? "text-red-500" : "text-muted")}>
                                        ${c.totalDue.toFixed(2)}
                                    </p>
                                </div>
                                {c.credit > 0 && (
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Credit</p>
                                        <p className="text-xl font-bold text-green-500 tracking-tight">
                                            ${c.credit.toFixed(2)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedCustomer(c); setActionType("ADD_DUE"); }}
                                    disabled={!hasPermission('Dues')}
                                    className="flex items-center justify-center gap-2 bg-surface-light hover:bg-surface-light/80 disabled:opacity-30 py-3 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                                >
                                    <Plus className="w-4 h-4" /> Add Due
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedCustomer(c); setActionType("SETTLE"); }}
                                    disabled={!hasPermission('Dues')}
                                    className="flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-fg disabled:opacity-30 py-3 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                                >
                                    <HandCoins className="w-4 h-4" /> Settle
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleViewHistory(c); }}
                                    disabled={!hasPermission('Dues')}
                                    className="col-span-2 flex items-center justify-center gap-2 border border-surface-light hover:bg-surface-light disabled:opacity-30 py-2 rounded-xl text-xs font-bold text-muted hover:text-foreground transition-all"
                                >
                                    View History
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modals */}
            {/* Add / Edit Customer Modal */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-surface-light w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <h2 className="text-2xl font-bold mb-6 font-serif italic text-foreground">
                            {isEditModalOpen ? "Edit Customer" : "New Customer"}
                        </h2>
                        <form onSubmit={isEditModalOpen ? handleUpdate : handleCreate} className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-muted uppercase mb-1.5 block ml-1">Name</label>
                                <input required className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                                    value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted uppercase mb-1.5 block ml-1">Phone</label>
                                <input required className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                                    value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                                    placeholder="Enter phone number"
                                />
                            </div>
                            {!isEditModalOpen && (
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1.5 block ml-1">Initial Due ($)</label>
                                    <input type="number" min="0" step="0.01" className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                                        value={formData.totalDue} onChange={e => setFormData(p => ({ ...p, totalDue: e.target.value }))}
                                    />
                                </div>
                            )}
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 bg-surface-light hover:bg-surface-light/80 py-3 rounded-xl text-sm font-bold transition-colors">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={!hasPermission('Dues')}
                                    className="flex-1 bg-primary disabled:opacity-50 text-primary-fg py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                                >
                                    {isEditModalOpen ? "Save Changes" : "Create Customer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedCustomer && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-surface-light w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto text-red-500">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-center mb-2">Delete Customer?</h2>
                        <p className="text-center text-muted mb-8">
                            Are you sure you want to delete <span className="font-bold text-foreground">{selectedCustomer.name}</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-surface-light hover:bg-surface-light/80 py-3 rounded-xl text-sm font-bold transition-colors">Cancel</button>
                            <button
                                onClick={handleDelete}
                                disabled={!hasPermission('Dues')}
                                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Modal (Add Due / Settle) */}
            {selectedCustomer && actionType && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-surface-light w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <h2 className="text-2xl font-bold mb-1 font-serif italic">
                            {actionType === "SETTLE" ? "Settle Payment" : "Add New Due"}
                        </h2>
                        <p className="text-sm text-muted mb-6">For <span className="font-bold text-foreground">{selectedCustomer.name}</span></p>

                        <form onSubmit={handleTransaction} className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-muted uppercase mb-1.5 block ml-1">Amount ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                                    <input
                                        type="number" required autoFocus min="0" step="0.01"
                                        className="w-full bg-background border border-surface-light rounded-xl pl-11 pr-4 py-3 text-lg font-bold font-mono focus:outline-none focus:border-primary transition-colors"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                {/* Quick Pay Buttons */}
                                {actionType === "SETTLE" && selectedCustomer.totalDue > 0 && (
                                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                                        <button type="button" onClick={setFullDue} className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-lg text-xs font-bold whitespace-nowrap transition-colors">
                                            Full Due (${selectedCustomer.totalDue.toFixed(2)})
                                        </button>
                                        <button type="button" onClick={() => setAmount((selectedCustomer.totalDue / 2).toFixed(2))} className="px-3 py-1.5 bg-surface-light hover:bg-surface-light/80 border border-surface-light/50 rounded-lg text-xs font-bold whitespace-nowrap transition-colors">
                                            50%
                                        </button>
                                        <button type="button" onClick={() => setAmount("100")} className="px-3 py-1.5 bg-surface-light hover:bg-surface-light/80 border border-surface-light/50 rounded-lg text-xs font-bold whitespace-nowrap transition-colors">
                                            $100
                                        </button>
                                    </div>
                                )}
                            </div>

                            {actionType === "SETTLE" && Number(amount) > selectedCustomer.totalDue && (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-xs text-green-500 flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                    <div>
                                        <span className="font-bold block mb-0.5">Overpayment Detected</span>
                                        ${(Number(amount) - selectedCustomer.totalDue).toFixed(2)} will be added to the customer's credit balance.
                                    </div>
                                </div>
                            )}

                            {actionType === "ADD_DUE" && (selectedCustomer.credit || 0) > 0 && (
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-500 flex items-start gap-3">
                                    <Wallet className="w-5 h-5 shrink-0" />
                                    <div>
                                        <span className="font-bold block mb-0.5">Credit Available</span>
                                        ${(selectedCustomer.credit || 0).toFixed(2)} credit will be automatically applied to this due.
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => { setSelectedCustomer(null); setActionType(null); }} className="flex-1 bg-surface-light hover:bg-surface-light/80 py-3 rounded-xl text-sm font-bold transition-colors">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={!hasPermission('Dues')}
                                    className={cn("flex-1 py-3 rounded-xl text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95 text-white disabled:opacity-50", actionType === "SETTLE" ? "bg-green-500 hover:bg-green-600 shadow-green-500/20" : "bg-red-500 hover:bg-red-600 shadow-red-500/20")}
                                >
                                    {actionType === "SETTLE" ? "Confirm Payment" : "Add Due"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {isHistoryModalOpen && selectedCustomer && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-surface-light w-full max-w-3xl rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center mb-6 border-b border-surface-light pb-6">
                            <div>
                                <h2 className="text-2xl font-bold font-serif italic">Transaction History</h2>
                                <p className="text-sm text-muted mt-1">
                                    History for <span className="font-bold text-foreground">{selectedCustomer.name}</span>
                                </p>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="w-10 h-10 rounded-full bg-surface-light hover:bg-surface-light/80 flex items-center justify-center transition-all">
                                <Plus className="w-6 h-6 rotate-45 text-muted" />
                            </button>
                        </div>

                        <div className="flex gap-6 mb-6">
                            <div className="flex-1 bg-surface-light/30 rounded-2xl p-4 border border-surface-light">
                                <p className="text-[10px] uppercase font-bold text-muted tracking-widest mb-1">Total Due</p>
                                <p className="text-2xl font-bold text-red-500">${selectedCustomer.totalDue.toFixed(2)}</p>
                            </div>
                            <div className="flex-1 bg-surface-light/30 rounded-2xl p-4 border border-surface-light">
                                <p className="text-[10px] uppercase font-bold text-muted tracking-widest mb-1">Available Credit</p>
                                <p className="text-2xl font-bold text-green-500">${selectedCustomer.credit?.toFixed(2) || '0.00'}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-surface sticky top-0 z-10">
                                    <tr className="border-b border-surface-light">
                                        <th className="px-4 py-4 font-bold text-muted uppercase text-xs tracking-wider">Date</th>
                                        <th className="px-4 py-4 font-bold text-muted uppercase text-xs tracking-wider">Description</th>
                                        <th className="px-4 py-4 font-bold text-muted uppercase text-xs tracking-wider">Type</th>
                                        <th className="px-4 py-4 font-bold text-muted uppercase text-xs tracking-wider text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-light/50">
                                    {history.length === 0 ? (
                                        <tr><td colSpan={4} className="px-4 py-12 text-center text-muted font-medium">No transactions found.</td></tr>
                                    ) : (
                                        history.map((item) => {
                                            const isDebt = item.type === 'ORDER' || item.type === 'CHARGE';
                                            return (
                                                <tr key={item.id} className="hover:bg-surface-light/30 transition-colors group">
                                                    <td className="px-4 py-4 text-muted whitespace-nowrap font-mono text-xs">{new Date(item.date).toLocaleString()}</td>
                                                    <td className="px-4 py-4 font-medium text-foreground">{item.description}</td>
                                                    <td className="px-4 py-4">
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide",
                                                            isDebt ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-green-500/10 text-green-500 border-green-500/20"
                                                        )}>
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                    <td className={cn(
                                                        "px-4 py-4 font-mono font-bold text-right text-base",
                                                        isDebt ? "text-red-500" : "text-green-500"
                                                    )}>
                                                        {isDebt ? '+' : '-'}${item.amount.toFixed(2)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
