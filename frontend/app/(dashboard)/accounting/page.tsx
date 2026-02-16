"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Tag, Search, Filter, Trash2, Edit, Download, Box, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, eachDayOfInterval } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    AreaChart,
    Area
} from "recharts";

interface Expense {
    id: number;
    description: string;
    amount: number;
    category: string;
    date: string;
}

const CATEGORIES = [
    { value: "INVENTORY", color: "#f97316" }, // Orange
    { value: "SALARY", color: "#a855f7" },    // Purple
    { value: "UTILITY", color: "#3b82f6" },   // Blue
    { value: "RENT", color: "#ec4899" },      // Pink
    { value: "OTHER", color: "#64748b" },     // Slate
];

export default function AccountingPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [revenue, setRevenue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    // Date Filter State
    const [dateRange, setDateRange] = useState({
        start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
        end: format(endOfMonth(new Date()), "yyyy-MM-dd")
    });

    // Form State
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        category: "INVENTORY",
        date: format(new Date(), "yyyy-MM-dd")
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch with date filters
            const [expRes, revRes, duesRes] = await Promise.all([
                fetch(`${API_URL}/expenses?startDate=${dateRange.start}&endDate=${dateRange.end}`),
                fetch(`${API_URL}/reports/sales?start=${dateRange.start}&end=${dateRange.end}`),
                fetch(`${API_URL}/customers/report`) // Dues report might need range too in future
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
    }, [dateRange]);

    const filteredExpenses = useMemo(() =>
        expenses.filter(e =>
            e.description.toLowerCase().includes(search.toLowerCase()) ||
            e.category.toLowerCase().includes(search.toLowerCase())
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        , [expenses, search]);

    const totalExpenses = useMemo(() => filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0), [filteredExpenses]);
    const netProfit = revenue - totalExpenses;

    // Allocation Chart Data
    const categoryData = useMemo(() => {
        const data: any = {};
        filteredExpenses.forEach(exp => {
            data[exp.category] = (data[exp.category] || 0) + Number(exp.amount);
        });
        return Object.keys(data).map(key => ({
            name: key,
            value: data[key],
            color: CATEGORIES.find(c => c.value === key)?.color || "#64748b"
        }));
    }, [filteredExpenses]);

    // Trend Chart Data
    const trendData = useMemo(() => {
        const days = eachDayOfInterval({
            start: parseISO(dateRange.start),
            end: parseISO(dateRange.end)
        });

        return days.map(day => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayExpenses = expenses
                .filter(e => format(parseISO(e.date), "yyyy-MM-dd") === dateStr)
                .reduce((acc, curr) => acc + Number(curr.amount), 0);
            return {
                date: format(day, "MMM dd"),
                amount: dayExpenses
            };
        });
    }, [expenses, dateRange]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingExpense ? 'PATCH' : 'POST';
            const url = editingExpense ? `${API_URL}/expenses/${editingExpense.id}` : `${API_URL}/expenses`;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                    date: new Date(formData.date).toISOString()
                })
            });

            if (res.ok) {
                fetchData();
                closeModal();
            }
        } catch (e) {
            console.error("Failed to save expense", e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this expense?")) return;
        try {
            const res = await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleExport = () => {
        const headers = ["Date", "Description", "Category", "Amount"];
        const csv = [
            headers.join(","),
            ...filteredExpenses.map(e => `${format(parseISO(e.date), "yyyy-MM-dd")},"${e.description}",${e.category},${e.amount}`)
        ].join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses_${dateRange.start}_to_${dateRange.end}.csv`;
        a.click();
    };

    const openModal = (exp?: Expense) => {
        if (exp) {
            setEditingExpense(exp);
            setFormData({
                description: exp.description,
                amount: exp.amount.toString(),
                category: exp.category,
                date: format(parseISO(exp.date), "yyyy-MM-dd")
            });
        } else {
            setEditingExpense(null);
            setFormData({
                description: "",
                amount: "",
                category: "INVENTORY",
                date: format(new Date(), "yyyy-MM-dd")
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight font-serif italic dark:text-white">Accounting</h1>
                    <p className="text-sm text-muted mt-2">Track expenses, analyze allocation, and monitor profitability.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-surface border border-surface-light px-5 py-2.5 rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Net Profit</p>
                            <p className={cn("text-xl font-bold leading-none", netProfit >= 0 ? "text-primary" : "text-red-500")}>
                                ₹{netProfit.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleExport}
                        className="bg-surface border border-surface-light text-foreground p-3 rounded-full hover:bg-surface-light transition-all shadow-sm"
                        title="Export CSV"
                    >
                        <Download className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => openModal()}
                        className="bg-primary hover:bg-primary/90 text-black px-6 py-3 rounded-full text-sm font-bold shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Add Expense
                    </button>
                </div>
            </div>

            {/* Controls & Metrics Row */}
            <div className="flex flex-col xl:flex-row gap-6">
                {/* Date and Search */}
                <div className="flex flex-col md:flex-row gap-4 flex-1">
                    <div className="flex items-center gap-3 bg-surface border border-surface-light px-4 py-2.5 rounded-2xl flex-1 focus-within:ring-2 ring-primary/20 transition-all">
                        <Search className="w-4 h-4 text-muted" />
                        <input
                            className="bg-transparent text-sm focus:outline-none w-full placeholder:text-muted/50 dark:text-white"
                            placeholder="Search descriptions, categories..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center bg-surface border border-surface-light rounded-2xl p-1 shadow-sm">
                        <Calendar className="w-4 h-4 ml-3 text-muted" />
                        <input
                            type="date"
                            className="bg-transparent border-none outline-none text-xs p-2.5 dark:text-white"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                        <span className="text-muted/30">|</span>
                        <input
                            type="date"
                            className="bg-transparent border-none outline-none text-xs p-2.5 dark:text-white"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>
                </div>

                {/* Mini Stats */}
                <div className="flex gap-4">
                    <div className="flex-1 bg-surface border border-surface-light p-4 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest">Revenue</p>
                            <p className="font-bold">₹{revenue.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex-1 bg-surface border border-surface-light p-4 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest">Expenses</p>
                            <p className="font-bold">₹{totalExpenses.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Expense List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-bold dark:text-white">Recent Transactions</h3>
                        <span className="text-xs font-medium text-muted bg-surface-light px-3 py-1.5 rounded-full">
                            {filteredExpenses.length} Matches
                        </span>
                    </div>

                    <div className="grid gap-3">
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="h-20 bg-surface/20 rounded-2xl animate-pulse border border-surface-light" />
                                ))
                            ) : filteredExpenses.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="bg-surface border border-surface-light p-16 rounded-[32px] text-center"
                                >
                                    <Box className="w-16 h-16 text-muted/20 mx-auto mb-4" />
                                    <p className="text-muted font-bold text-lg">No transactions found.</p>
                                    <p className="text-sm text-muted/60 mt-1">Try adjusting your search or date range.</p>
                                </motion.div>
                            ) : (
                                filteredExpenses.map(exp => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        key={exp.id}
                                        className="group bg-surface border border-surface-light p-4 rounded-[24px] flex items-center justify-between hover:border-primary/50 hover:shadow-lg transition-all"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center text-[10px] font-black tracking-tighter shadow-sm",
                                                exp.category === 'INVENTORY' ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" :
                                                    exp.category === 'SALARY' ? "bg-purple-500/10 text-purple-500 border border-purple-500/20" :
                                                        exp.category === 'UTILITY' ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                                                            exp.category === 'RENT' ? "bg-pink-500/10 text-pink-500 border border-pink-500/20" :
                                                                "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                                            )}>
                                                {exp.category.substring(0, 4)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-base dark:text-white">{exp.description}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                        <Calendar className="w-3 h-3 text-primary" /> {format(parseISO(exp.date), "dd MMM yyyy")}
                                                    </p>
                                                    <span className="w-1 h-1 rounded-full bg-muted/30" />
                                                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                        <Tag className="w-3 h-3 text-primary" /> {exp.category}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="font-black text-lg text-red-500">-₹{Number(exp.amount).toLocaleString()}</p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                                                <button onClick={() => openModal(exp)} className="p-2.5 hover:bg-primary/10 rounded-xl text-muted hover:text-primary transition-all">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(exp.id)} className="p-2.5 hover:bg-red-500/10 rounded-xl text-muted hover:text-red-500 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Charts Sidebar */}
                <div className="space-y-8">
                    {/* Allocation Donut */}
                    <div className="bg-surface border border-surface-light p-8 rounded-[32px] shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                        <h3 className="text-sm font-black dark:text-white mb-8 uppercase tracking-[0.2em] text-muted/60">Expense Allocation</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {categoryData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', borderRadius: '16px', border: 'none', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            {categoryData.map((c: any) => (
                                <div key={c.name} className="flex items-center gap-2.5 bg-surface-light/30 p-2 rounded-xl border border-surface-light/10">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: c.color }} />
                                    <span className="text-[10px] font-black text-muted uppercase tracking-tighter">{c.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Trend Chart */}
                    <div className="bg-surface border border-surface-light p-8 rounded-[32px] shadow-sm">
                        <h3 className="text-sm font-black dark:text-white mb-8 uppercase tracking-[0.2em] text-muted/60">Spending Trend</h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#71717a' }}
                                        interval="preserveStartEnd"
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', borderRadius: '16px', border: 'none', color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-surface border border-surface-light w-full max-w-md rounded-[40px] p-10 shadow-2xl relative overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold font-serif italic dark:text-white">
                                    {editingExpense ? 'Edit Transaction' : 'New Transaction'}
                                </h2>
                                <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center bg-surface-light rounded-full text-muted hover:text-foreground hover:rotate-90 transition-all">
                                    <Plus className="w-6 h-6 rotate-45" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-muted uppercase mb-2 block tracking-[0.2em] ml-1">Description</label>
                                    <input
                                        required autoFocus
                                        className="w-full bg-surface-light/50 border border-surface-light rounded-[20px] px-5 py-4 text-sm focus:outline-none focus:ring-4 ring-primary/10 focus:border-primary dark:text-white transition-all"
                                        value={formData.description}
                                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                        placeholder="e.g., Monthly Inventory Restock"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-[10px] font-black text-muted uppercase mb-2 block tracking-[0.2em] ml-1">Amount (₹)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                            <input
                                                type="number" min="0" step="0.01" required
                                                className="w-full bg-surface-light/50 border border-surface-light rounded-[20px] pl-12 pr-5 py-4 text-sm focus:outline-none focus:ring-4 ring-primary/10 focus:border-primary dark:text-white transition-all"
                                                value={formData.amount}
                                                onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-muted uppercase mb-2 block tracking-[0.2em] ml-1">Category</label>
                                        <div className="relative">
                                            <Tag className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                            <select
                                                className="w-full bg-surface-light/50 border border-surface-light rounded-[20px] pl-12 pr-5 py-4 text-sm focus:outline-none focus:ring-4 ring-primary/10 focus:border-primary dark:text-white transition-all appearance-none"
                                                value={formData.category}
                                                onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                                            >
                                                <option value="INVENTORY">Inventory</option>
                                                <option value="SALARY">Salary</option>
                                                <option value="UTILITY">Utility</option>
                                                <option value="RENT">Rent</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-muted uppercase mb-2 block tracking-[0.2em] ml-1">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                        <input
                                            type="date" required
                                            className="w-full bg-surface-light/50 border border-surface-light rounded-[20px] pl-12 pr-5 py-4 text-sm focus:outline-none focus:ring-4 ring-primary/10 focus:border-primary dark:text-white transition-all"
                                            value={formData.date}
                                            onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-primary hover:bg-primary/90 text-black py-4 rounded-[20px] text-sm font-black shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all"
                                    >
                                        {editingExpense ? 'Update Transaction' : 'Save Transaction'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
