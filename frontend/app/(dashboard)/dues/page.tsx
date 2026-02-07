"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Wallet, DollarSign, HandCoins } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";

interface Customer {
    id: number;
    name: string;
    phone: string;
    totalDue: number;
}

export default function DuesPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [actionType, setActionType] = useState<"SETTLE" | "ADD_DUE" | null>(null);

    // Forms
    const [formData, setFormData] = useState({ name: "", phone: "", totalDue: "0" });
    const [amount, setAmount] = useState("");

    // History
    const [history, setHistory] = useState<{ id: string, type: string, amount: number, date: string, description: string }[]>([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

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

    const handleTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer || !actionType) return;

        const endpoint = actionType === "SETTLE" ? "settle" : "add-due";
        try {
            const res = await fetch(`${API_URL}/customers/${selectedCustomer.id}/${endpoint}`, {
                method: 'PATCH', // NestJS controller defined as PATCH
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
        try {
            const res = await fetch(`${API_URL}/customers/${customer.id}/history`);
            if (res.ok) {
                setHistory(await res.json());
            }
        } catch (e) { console.error(e); }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dues Management</h1>
                    <p className="text-muted text-sm mt-1">Track customer debts and settlements</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-primary text-primary-fg px-4 py-2 rounded-xl text-sm font-bold hover:brightness-90 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add Customer
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 bg-surface p-2 rounded-2xl border border-border w-fit">
                <Search className="w-4 h-4 text-muted ml-2" />
                <input
                    className="bg-transparent text-sm focus:outline-none w-64"
                    placeholder="Search by name or phone..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? <p className="text-muted col-span-full">Loading...</p> :
                    filteredCustomers.length === 0 ? <p className="text-muted col-span-full">No customers found.</p> :
                        filteredCustomers.map(c => (
                            <div key={c.id} className="bg-surface border border-border p-5 rounded-3xl flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-full bg-surface-light flex items-center justify-center font-bold text-lg text-muted">
                                        {c.name.charAt(0)}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted font-bold uppercase">Total Due</p>
                                        <p className={cn("text-2xl font-bold", c.totalDue > 0 ? "text-red-500" : "text-green-500")}>
                                            ${c.totalDue.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-lg">{c.name}</h3>
                                    <p className="text-sm text-muted">{c.phone}</p>
                                </div>

                                <div className="flex gap-2 mt-auto pt-2">
                                    <button
                                        onClick={() => handleViewHistory(c)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-surface-light hover:bg-surface-light/80 py-2 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        <Search className="w-4 h-4" /> History
                                    </button>
                                    <button
                                        onClick={() => { setSelectedCustomer(c); setActionType("ADD_DUE"); }}
                                        className="flex-1 flex items-center justify-center gap-2 bg-surface-light hover:bg-surface-light/80 py-2 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Add Due
                                    </button>
                                    <button
                                        onClick={() => { setSelectedCustomer(c); setActionType("SETTLE"); }}
                                        className="flex-1 flex items-center justify-center gap-2 bg-primary/20 text-primary hover:bg-primary/30 py-2 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        <HandCoins className="w-4 h-4" /> Settle
                                    </button>
                                </div>
                            </div>
                        ))
                }
            </div>

            {/* Add Customer Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-border w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-4">New Customer</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted uppercase mb-1 block">Name</label>
                                <input required className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted uppercase mb-1 block">Phone</label>
                                <input required className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted uppercase mb-1 block">Initial Due ($)</label>
                                <input type="number" className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    value={formData.totalDue} onChange={e => setFormData(p => ({ ...p, totalDue: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-surface-light hover:bg-surface-light/80 py-2.5 rounded-xl text-sm font-bold">Cancel</button>
                                <button type="submit" className="flex-1 bg-primary text-primary-fg py-2.5 rounded-xl text-sm font-bold">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transaction Modal */}
            {selectedCustomer && actionType && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-border w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-1">
                            {actionType === "SETTLE" ? "Settle Payment" : "Add New Due"}
                        </h2>
                        <p className="text-sm text-muted mb-4">For {selectedCustomer.name}</p>

                        <form onSubmit={handleTransaction} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted uppercase mb-1 block">Amount ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                    <input
                                        type="number" required autoFocus
                                        className="w-full bg-surface-light border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => { setSelectedCustomer(null); setActionType(null); }} className="flex-1 bg-surface-light hover:bg-surface-light/80 py-2.5 rounded-xl text-sm font-bold">Cancel</button>
                                <button type="submit" className={cn("flex-1 py-2.5 rounded-xl text-sm font-bold text-primary-fg", actionType === "SETTLE" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600")}>
                                    {actionType === "SETTLE" ? "Confirm Payment" : "Add Due"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {isHistoryModalOpen && selectedCustomer && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-border w-full max-w-2xl rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center mb-4 border-b border-border pb-4">
                            <div>
                                <h2 className="text-xl font-bold">Transaction History</h2>
                                <p className="text-sm text-muted">For {selectedCustomer.name} - Total Due: ${selectedCustomer.totalDue.toFixed(2)}</p>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="text-muted hover:text-foreground p-2 hover:bg-surface-light rounded-full transition-colors">
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-surface-light/50 text-muted border-b border-border sticky top-0 backdrop-blur-md">
                                    <tr>
                                        <th className="px-4 py-3 font-bold">Date</th>
                                        <th className="px-4 py-3 font-bold">Description</th>
                                        <th className="px-4 py-3 font-bold">Type</th>
                                        <th className="px-4 py-3 font-bold text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {history.length === 0 ? (
                                        <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No transactions found.</td></tr>
                                    ) : (
                                        history.map((item) => {
                                            const isDebt = item.type === 'ORDER' || item.type === 'CHARGE';
                                            return (
                                                <tr key={item.id} className="hover:bg-surface-light/30 transition-colors">
                                                    <td className="px-4 py-3 text-muted whitespace-nowrap">{new Date(item.date).toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-medium">{item.description}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-xs font-bold border",
                                                            isDebt ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-green-500/10 text-green-500 border-green-500/20"
                                                        )}>
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                    <td className={cn(
                                                        "px-4 py-3 font-mono font-bold text-right",
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
