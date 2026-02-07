"use client";

import { useEffect, useState } from "react";
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";

interface Expense {
    id: number;
    description: string;
    amount: number;
    category: string;
    date: string;
}

export default function AccountingPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [revenue, setRevenue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        category: "INVENTORY",
        date: new Date().toISOString().split('T')[0]
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            // Parallel fetch for efficiency
            const [expRes, revRes, duesRes] = await Promise.all([
                fetch(`${API_URL}/expenses`),
                fetch(`${API_URL}/reports/sales`),
                fetch(`${API_URL}/customers/report`)
            ]);

            const expJson = await expRes.json();
            const revJson = await revRes.json();
            const duesJson = await duesRes.json();

            setExpenses(expJson);
            // Total Revenue = Sales Revenue + Dues Collected
            setRevenue((revJson.totalRevenue || 0) + (duesJson.totalCollected || 0));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const netProfit = revenue - totalExpenses;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                    date: new Date(formData.date).toISOString()
                })
            });

            if (res.ok) {
                fetchData();
                setIsModalOpen(false);
                setFormData({ description: "", amount: "", category: "INVENTORY", date: new Date().toISOString().split('T')[0] });
            }
        } catch (e) {
            console.error("Failed to add expense", e);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary text-primary-fg px-4 py-2 rounded-xl text-sm font-bold hover:brightness-90 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add Expense
                </button>
            </div>

            {/* Financial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Revenue */}
                <div className="bg-surface border border-border p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-24 h-24 text-green-500" />
                    </div>
                    <p className="text-sm font-bold text-muted uppercase tracking-wider mb-1">Total Revenue</p>
                    <h2 className="text-4xl font-black text-green-500">₹{revenue.toLocaleString()}</h2>
                </div>

                {/* Expenses */}
                <div className="bg-surface border border-border p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown className="w-24 h-24 text-red-500" />
                    </div>
                    <p className="text-sm font-bold text-muted uppercase tracking-wider mb-1">Total Expenses</p>
                    <h2 className="text-4xl font-black text-red-500">₹{totalExpenses.toLocaleString()}</h2>
                </div>

                {/* Net Profit */}
                <div className="bg-surface border border-border p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign className="w-24 h-24 text-blue-500" />
                    </div>
                    <p className="text-sm font-bold text-muted uppercase tracking-wider mb-1">Net Profit</p>
                    <h2 className={cn("text-4xl font-black", netProfit >= 0 ? "text-blue-500" : "text-red-500")}>
                        ₹{netProfit.toLocaleString()}
                    </h2>
                </div>
            </div>

            {/* Expense List */}
            <div>
                <h3 className="text-xl font-bold mb-4">Recent Expenses</h3>
                <div className="grid gap-4">
                    {loading ? <p className="text-muted">Loading...</p> : expenses.length === 0 ? <p className="text-muted">No expenses recorded.</p> : (
                        expenses.map(exp => (
                            <div key={exp.id} className="bg-surface border border-border p-4 rounded-2xl flex items-center justify-between hover:border-primary/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold",
                                        exp.category === 'INVENTORY' ? "bg-orange-500/20 text-orange-500" :
                                            exp.category === 'SALARY' ? "bg-purple-500/20 text-purple-500" :
                                                "bg-gray-500/20 text-gray-400"
                                    )}>
                                        {exp.category.substring(0, 3)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold">{exp.description}</h4>
                                        <p className="text-xs text-muted flex items-center gap-2">
                                            <Calendar className="w-3 h-3" /> {new Date(exp.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <span className="font-bold text-red-500">-₹{Number(exp.amount).toLocaleString()}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-4">Add Expense</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted uppercase mb-1 block">Description</label>
                                <input
                                    required
                                    className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    placeholder="e.g., Coffee Beans"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Amount (₹)</label>
                                    <input
                                        type="number" min="0" step="0.01" required
                                        className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        value={formData.amount}
                                        onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Category</label>
                                    <select
                                        className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        value={formData.category}
                                        onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                                    >
                                        <option value="INVENTORY">Inventory</option>
                                        <option value="SALARY">Salary</option>
                                        <option value="UTILITY">Utility</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted uppercase mb-1 block">Date</label>
                                <input
                                    type="date" required
                                    className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    value={formData.date}
                                    onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-surface-light hover:bg-surface-light/80 text-foreground py-2.5 rounded-xl text-sm font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary hover:brightness-90 text-primary-fg py-2.5 rounded-xl text-sm font-bold transition-colors"
                                >
                                    Add Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
