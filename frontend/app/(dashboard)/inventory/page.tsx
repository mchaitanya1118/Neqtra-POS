"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Box, DollarSign, Package, Download, Filter, X, TrendingUp, AlertTriangle, Layers } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useInventoryStore, InventoryItem } from "@/store/useInventoryStore";
import { InventoryCard } from "@/components/inventory/InventoryCard";

export default function InventoryPage() {
    const { hasPermission } = useAuthStore();
    const { items, isLoading, fetchInventory, addItem, updateItem, deleteItem } = useInventoryStore();

    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "low" | "out">("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        quantity: "",
        unit: "kg",
        threshold: "10",
        price: "",
        supplier: ""
    });

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleEdit = (item: InventoryItem) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            quantity: item.quantity.toString(),
            unit: item.unit,
            threshold: item.threshold.toString(),
            price: (item.price || 0).toString(),
            supplier: item.supplier || ""
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({ name: "", quantity: "", unit: "kg", threshold: "10", price: "", supplier: "" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            quantity: Number(formData.quantity),
            threshold: Number(formData.threshold),
            price: Number(formData.price)
        };

        try {
            if (editingItem) {
                await updateItem(editingItem.id, payload);
            } else {
                await addItem(payload);
            }
            closeModal();
        } catch (err) {
            console.error("Failed to save inventory item:", err);
        }
    };

    const exportToCSV = () => {
        const headers = ["ID", "Name", "Quantity", "Unit", "Price", "Value", "Threshold", "Supplier"];
        const rows = items.map(item => [
            item.id,
            item.name,
            item.quantity,
            item.unit,
            item.price,
            item.quantity * item.price,
            item.threshold,
            item.supplier || ""
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                (item.supplier?.toLowerCase() || "").includes(search.toLowerCase());

            const isOutOfStock = item.quantity === 0;
            const isLowStock = !isOutOfStock && item.quantity <= item.threshold;

            if (filterStatus === "low") return matchesSearch && isLowStock;
            if (filterStatus === "out") return matchesSearch && isOutOfStock;
            return matchesSearch;
        });
    }, [items, search, filterStatus]);

    // Metrics
    const totalItems = items.length;
    const inventoryValue = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const lowStockCount = items.filter(i => i.quantity <= i.threshold && i.quantity > 0).length;
    const outOfStockCount = items.filter(i => i.quantity === 0).length;

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 relative min-h-screen">
            {/* Premium Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Box className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight dark:text-white">Inventory Control</h1>
                    </div>
                    <p className="text-muted font-medium ml-1">Real-time stock monitoring & asset management</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Metrics Cards */}
                    <div className="flex items-center gap-3 bg-surface border border-surface-light px-6 py-3 rounded-3xl shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest leading-none mb-1 text-nowrap">Total Items</p>
                            <p className="text-xl font-black leading-none">{totalItems}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-surface border border-surface-light px-6 py-3 rounded-3xl shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest leading-none mb-1 text-nowrap">Stock Value</p>
                            <p className="text-xl font-black leading-none">₹{inventoryValue.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={exportToCSV}
                            disabled={!hasPermission('Inventory')}
                            className="p-3.5 bg-surface-light hover:bg-surface disabled:opacity-30 border border-surface-light rounded-2xl transition-all hover:shadow-lg text-muted hover:text-primary active:scale-95"
                            title="Export Report"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            disabled={!hasPermission('Inventory')}
                            className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-black px-6 py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add Stock
                        </button>
                    </div>
                </div>
            </div>

            {/* Controls Layer */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-surface/50 backdrop-blur-md p-6 rounded-[32px] border border-surface-light">
                <div className="flex p-1.5 bg-surface-light/50 rounded-2xl border border-surface-light w-full md:w-auto overflow-x-auto">
                    {[
                        { id: 'all', label: 'All Stock', icon: Box, color: 'primary' },
                        { id: 'low', label: 'Low Stock', icon: AlertTriangle, color: 'yellow-500', count: lowStockCount },
                        { id: 'out', label: 'Out of Stock', icon: X, color: 'red-500', count: outOfStockCount }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterStatus(tab.id as any)}
                            className={cn(
                                "px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap",
                                filterStatus === tab.id
                                    ? "bg-surface-light shadow-xl text-foreground scale-105 border border-surface-light/50"
                                    : "text-muted hover:text-foreground/70"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4", filterStatus === tab.id && `text-${tab.color}`)} />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-md text-[10px] min-w-[20px] text-center",
                                    tab.id === 'low' ? "bg-yellow-500/10 text-yellow-600" : "bg-red-500/10 text-red-600"
                                )}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-3 bg-surface-light/50 border border-surface-light/50 px-5 py-3 rounded-2xl w-full md:w-96 focus-within:ring-4 ring-primary/10 transition-all group">
                        <Search className="w-5 h-5 text-muted group-focus-within:text-primary transition-colors" />
                        <input
                            className="bg-transparent text-sm font-bold focus:outline-none w-full placeholder:text-muted/50"
                            placeholder="Search items, suppliers..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-[320px] bg-surface-light/20 animate-pulse rounded-[32px] border border-surface-light" />
                    ))
                ) : filteredItems.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="col-span-full py-32 text-center"
                    >
                        <div className="w-24 h-24 bg-surface-light/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package className="w-10 h-10 opacity-20" />
                        </div>
                        <h2 className="text-2xl font-black text-muted/50">No inventory matches found</h2>
                        <p className="text-muted mt-2">Try adjusting your filters or search query</p>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredItems.map(item => (
                            <InventoryCard
                                key={item.id}
                                item={item}
                                onEdit={handleEdit}
                                onDelete={(id) => {
                                    if (confirm(`Remove ${item.name} from inventory?`)) deleteItem(id);
                                }}
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Premium Add/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-surface border border-surface-light w-full max-w-xl rounded-[40px] p-10 shadow-2xl overflow-hidden"
                        >
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 p-12 text-primary/5 -mr-8 -mt-8 rotate-12 pointer-events-none">
                                <Plus className="w-48 h-48" />
                            </div>

                            <div className="relative">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                        <TrendingUp className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black dark:text-white">
                                            {editingItem ? 'Update Stock' : 'New Stock Entry'}
                                        </h2>
                                        <p className="text-muted font-bold text-sm">Fill in the details for inventory tracking</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Item Name</label>
                                            <input
                                                required autoFocus
                                                className="w-full bg-surface-light/30 border border-surface-light rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-primary focus:ring-4 ring-primary/10 transition-all placeholder:text-muted/30"
                                                value={formData.name}
                                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                                placeholder="e.g. Whole Milk Gold Edition"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Initial Quantity</label>
                                            <input
                                                type="number" required min="0" step="any"
                                                className="w-full bg-surface-light/30 border border-surface-light rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-primary focus:ring-4 ring-primary/10 transition-all"
                                                value={formData.quantity}
                                                onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Measurement Unit</label>
                                            <select
                                                className="w-full bg-surface-light/30 border border-surface-light rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-primary transition-all appearance-none"
                                                value={formData.unit}
                                                onChange={e => setFormData(p => ({ ...p, unit: e.target.value }))}
                                            >
                                                <option value="kg">kilograms (kg)</option>
                                                <option value="liters">liters (L)</option>
                                                <option value="pcs">pieces (pcs)</option>
                                                <option value="oz">ounces (oz)</option>
                                                <option value="lbs">pounds (lbs)</option>
                                                <option value="box">boxes</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Cost Price (₹)</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                                <input
                                                    type="number" min="0" step="0.01"
                                                    className="w-full bg-surface-light/30 border border-surface-light rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:outline-none focus:border-primary focus:ring-4 ring-primary/10 transition-all"
                                                    value={formData.price}
                                                    onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Low Stock Threshold</label>
                                            <input
                                                type="number" required min="0"
                                                className="w-full bg-surface-light/30 border border-surface-light rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-primary focus:ring-4 ring-primary/10 transition-all"
                                                value={formData.threshold}
                                                onChange={e => setFormData(p => ({ ...p, threshold: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Supplier Details</label>
                                            <input
                                                className="w-full bg-surface-light/30 border border-surface-light rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-primary focus:ring-4 ring-primary/10 transition-all placeholder:text-muted/30"
                                                value={formData.supplier}
                                                onChange={e => setFormData(p => ({ ...p, supplier: e.target.value }))}
                                                placeholder="e.g. Acme Farm Supplies Ltd."
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-6">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="flex-1 bg-surface-light hover:bg-surface-light/70 text-foreground py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!hasPermission('Inventory')}
                                            className="flex-1 bg-primary hover:brightness-110 disabled:opacity-50 text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-95"
                                        >
                                            {editingItem ? 'Confirm Changes' : 'Initialize Stock'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
