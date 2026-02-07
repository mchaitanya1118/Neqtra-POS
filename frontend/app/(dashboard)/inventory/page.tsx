"use client";

import { useEffect, useState } from "react";
import { Plus, Search, AlertTriangle, Box, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";

interface InventoryItem {
    id: number;
    name: string;
    quantity: number;
    unit: string;
    threshold: number;
    supplier: string;
}

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        quantity: "",
        unit: "kg",
        threshold: "10",
        supplier: ""
    });

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/inventory`);
            const data = await res.json();
            setItems(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/inventory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    quantity: Number(formData.quantity),
                    threshold: Number(formData.threshold)
                })
            });

            if (res.ok) {
                fetchInventory();
                setIsModalOpen(false);
                setFormData({ name: "", quantity: "", unit: "kg", threshold: "10", supplier: "" });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
                    <p className="text-muted text-sm mt-1">Track stock levels and suppliers</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary text-primary-fg px-4 py-2 rounded-xl text-sm font-bold hover:brightness-90 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add Item
                </button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 bg-surface p-2 rounded-2xl border border-border w-fit">
                <Search className="w-4 h-4 text-muted ml-2" />
                <input
                    className="bg-transparent text-sm focus:outline-none w-64"
                    placeholder="Search inventory..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-surface border border-border rounded-3xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-surface-light text-muted uppercase text-xs font-bold">
                        <tr>
                            <th className="p-4 pl-6">Item Name</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Quantity</th>
                            <th className="p-4">Unit</th>
                            <th className="p-4">Threshold</th>
                            <th className="p-4">Supplier</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-muted">Loading inventory...</td></tr>
                        ) : filteredItems.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-muted">No items found.</td></tr>
                        ) : (
                            filteredItems.map(item => {
                                const isLowStock = item.quantity <= item.threshold;
                                const isOutOfStock = item.quantity === 0;

                                return (
                                    <tr key={item.id} className="hover:bg-surface-light/50 transition-colors group">
                                        <td className="p-4 pl-6 font-bold">{item.name}</td>
                                        <td className="p-4">
                                            {isOutOfStock ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-500 border border-red-500/20">
                                                    <AlertTriangle className="w-3 h-3" /> Out of Stock
                                                </span>
                                            ) : isLowStock ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-500 border border-yellow-500/20">
                                                    <AlertTriangle className="w-3 h-3" /> Low Stock
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-500 border border-green-500/20">
                                                    <Box className="w-3 h-3" /> In Stock
                                                </span>
                                            )}
                                        </td>
                                        <td className={cn("p-4 font-mono font-bold", isLowStock ? "text-red-500" : "text-foreground")}>
                                            {item.quantity}
                                        </td>
                                        <td className="p-4 text-muted">{item.unit}</td>
                                        <td className="p-4 text-muted font-mono">{item.threshold}</td>
                                        <td className="p-4 text-muted">{item.supplier || '-'}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-4">Add Inventory Item</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted uppercase mb-1 block">Name</label>
                                <input
                                    required autoFocus
                                    className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    value={formData.name}
                                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Milk"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Quantity</label>
                                    <input
                                        type="number" required
                                        className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        value={formData.quantity}
                                        onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Unit</label>
                                    <select
                                        className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        value={formData.unit}
                                        onChange={e => setFormData(p => ({ ...p, unit: e.target.value }))}
                                    >
                                        <option value="kg">kg</option>
                                        <option value="liters">liters</option>
                                        <option value="pcs">pcs</option>
                                        <option value="oz">oz</option>
                                        <option value="lbs">lbs</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Low Stock Alert</label>
                                    <input
                                        type="number" required
                                        className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        value={formData.threshold}
                                        onChange={e => setFormData(p => ({ ...p, threshold: e.target.value }))}
                                        placeholder="Min Qty"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Supplier</label>
                                    <input
                                        className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        value={formData.supplier}
                                        onChange={e => setFormData(p => ({ ...p, supplier: e.target.value }))}
                                    />
                                </div>
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
                                    Add Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
