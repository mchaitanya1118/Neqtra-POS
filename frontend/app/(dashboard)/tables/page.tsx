"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTableStore } from "@/store/useTableStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Plus, Search, RefreshCw, ShoppingBag, Truck, AlertCircle, Printer, Eye, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";
import { TableModal } from "@/components/pos/TableModal";

// --- Types for Orders ---
interface OrderItem {
    menuItem: { title: string; price: number };
    quantity: number;
}

interface ActiveOrder {
    id: number;
    tableName: string;
    totalAmount: number;
    items: OrderItem[];
    createdAt: string;
    status: string;
}

export default function TablesPage() {
    const { tables, fetchTables, isLoading } = useTableStore();
    const router = useRouter();
    const { user } = useAuthStore();
    const [search, setSearch] = useState("");
    const [orders, setOrders] = useState<ActiveOrder[]>([]);
    const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
    const [now, setNow] = useState<number | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<{ id: number; label: string; capacity: number } | null>(null);

    // Fetch Tables & Orders
    useEffect(() => {
        setNow(Date.now()); // Set initial client time
        fetchTables();
        const fetchOrders = async () => {
            try {
                const res = await fetch(`${API_URL}/orders`);
                if (res.ok) {
                    const data = await res.json();
                    // Keep valid active orders
                    const active = data.filter((o: any) => ['PENDING', 'CONFIRMED', 'PARTIAL'].includes(o.status));
                    setOrders(active);
                }
            } catch (e) {
                console.error("Failed to fetch orders", e);
            }
        };

        fetchOrders();
        const interval = setInterval(() => {
            fetchTables(); // Sync table status
            fetchOrders();
            setNow(Date.now()); // Update time for elapsed calculation
        }, 10000); // Poll every 10s

        // Separate timer for UI updates (every minute is enough for "min ago" but 10s keeps it fresher)
        return () => clearInterval(interval);
    }, [fetchTables]);


    const handleTableClick = (table: any) => {
        if (user?.role === 'Waiter') {
            router.push(`/billing?tableName=${table.label}`);
            return;
        }

        // Admin toggle
        if (selectedTableId === table.id) {
            setSelectedTableId(null);
        } else {
            setSelectedTableId(table.id);
        }
    };

    // --- CRUD Actions ---
    const handleCreateTable = async (label: string, capacity: number) => {
        try {
            const res = await fetch(`${API_URL}/tables`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label, capacity, status: 'FREE' })
            });
            if (res.ok) {
                fetchTables();
            } else {
                alert("Failed to create table");
            }
        } catch (e) { console.error(e); }
    };

    const handleUpdateTable = async (label: string, capacity: number) => {
        if (!editingTable) return;
        try {
            const res = await fetch(`${API_URL}/tables/${editingTable.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label, capacity })
            });
            if (res.ok) {
                fetchTables();
                setEditingTable(null);
            } else {
                alert("Failed to update table");
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteTable = async (id: number, label: string) => {
        if (!confirm(`Are you sure you want to delete ${label}?`)) return;
        try {
            const res = await fetch(`${API_URL}/tables/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchTables();
                if (selectedTableId === id) setSelectedTableId(null);
            } else {
                alert("Failed to delete table. Check if it has active orders.");
            }
        } catch (e) { console.error(e); }
    };

    const openCreateModal = () => {
        setEditingTable(null); // Clear editing state
        setIsModalOpen(true);
    };

    const openEditModal = (table: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingTable({ id: table.id, label: table.label, capacity: table.capacity });
        setIsModalOpen(true);
    };


    // --- Helper to get active order for a table ---
    const getActiveOrder = (tableName: string) => {
        return orders.find(o => o.tableName && o.tableName.toLowerCase() === tableName.toLowerCase());
    };

    // --- Helper for Elapsed Time ---
    const getElapsedTime = (createdAt: string) => {
        if (!now) return "0 Min";
        const start = new Date(createdAt).getTime();
        const diff = Math.max(0, Math.floor((now - start) / 60000)); // minutes
        return `${diff} Min`;
    };

    // Grouping Logic
    const sections: Record<string, typeof tables> = {
        "AC Restaurant": [],
        "Garden Area": [],
        "Non-AC": []
    };

    const safeTables = Array.isArray(tables) ? tables : [];
    const filteredTables = safeTables.filter(t => t.label.toLowerCase().includes(search.toLowerCase()));

    filteredTables.forEach(table => {
        const label = table.label.toLowerCase();
        if (label.startsWith('ac') || label.startsWith('a')) {
            sections["AC Restaurant"].push(table);
        } else if (label.startsWith('g') || label.startsWith('o')) {
            sections["Garden Area"].push(table);
        } else {
            sections["Non-AC"].push(table);
        }
    });

    if (isLoading) return <div className="p-8 text-black dark:text-white">Loading tables...</div>;

    return (
        <div className="min-h-screen bg-[#f3f4f6] dark:bg-zinc-950 flex flex-col font-sans">
            {/* Top Toolbar */}
            <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4 shadow-sm z-10">
                <div className="flex items-center gap-6">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">Table View</h1>

                    <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-md px-3 py-1.5 border border-gray-200 dark:border-zinc-700 w-64">
                        <Search className="w-4 h-4 text-gray-400 mr-2" />
                        <input
                            className="bg-transparent border-none outline-none text-sm w-full text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                            placeholder="Search Table or Bill No"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => fetchTables()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md text-sm font-semibold hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-gray-700 dark:text-gray-200">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#d32f2f] hover:bg-[#b71c1c] text-white rounded-md text-sm font-bold shadow-sm transition-colors">
                        <Truck className="w-4 h-4" />
                        Delivery
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#d32f2f] hover:bg-[#b71c1c] text-white rounded-md text-sm font-bold shadow-sm transition-colors">
                        <ShoppingBag className="w-4 h-4" />
                        Pick Up
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2 bg-[#d32f2f] hover:bg-[#b71c1c] text-white rounded-md text-sm font-bold shadow-sm transition-all hover:shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        Add Table
                    </button>
                </div>
            </header>

            {/* Sub-Header & Legend */}
            <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-0">
                <div className="flex items-center gap-4">
                    <button className="bg-[#d32f2f] text-white px-4 py-1.5 rounded text-sm font-bold flex items-center gap-2 shadow-sm">
                        <Plus className="w-3 h-3" /> Contactless
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-900/50 rounded text-xs font-bold text-[#d32f2f] shadow-sm">
                        <AlertCircle className="w-3 h-3" />
                        Reconnect Bridge Service
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-400 overflow-x-auto">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div> Blank Table
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#fef9c3] border border-yellow-300"></div> Running Table
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div> Printed Table
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-yellow-200 border border-yellow-400"></div> Paid Table
                    </div>
                </div>
            </div>

            {/* Sections Grid */}
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-8 pb-20">
                {Object.entries(sections).map(([sectionName, sectionTables]) => (
                    <div key={sectionName} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {sectionTables.length > 0 && (
                            <>
                                <h2 className="text-[#d32f2f] font-bold text-sm uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-zinc-800 pb-2">
                                    {sectionName}
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
                                    {sectionTables.map(table => {
                                        const isSelected = selectedTableId === table.id;
                                        const activeOrder = getActiveOrder(table.label);
                                        const isOccupied = table.status === 'OCCUPIED' || !!activeOrder; // Rely on Order existence too

                                        // Dynamic Classes based on state
                                        let cardClasses = "aspect-square rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-md active:scale-95 relative overflow-hidden group ";
                                        if (isSelected) cardClasses += "ring-2 ring-primary border-primary ";
                                        else if (isOccupied) cardClasses += "bg-[#fef9c3] border-yellow-200 text-[#422006] "; // Yellow Card
                                        else cardClasses += "bg-white border-gray-200 text-gray-700 hover:border-gray-300 ";

                                        return (
                                            <div
                                                key={table.id}
                                                onClick={() => handleTableClick(table)}
                                                className={cardClasses}
                                            >
                                                {/* Edit/Delete Overlay (Only visible on hover + if admin) */}
                                                {(user?.role === 'Admin' || user?.role === 'Manager') && (
                                                    <div className="absolute top-1 right-1 flex gap-1 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => openEditModal(table, e)}
                                                            className="p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-100 text-gray-600"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </button>
                                                        {!isOccupied && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id, table.label); }}
                                                                className="p-1.5 bg-white rounded-full shadow-sm hover:bg-red-50 text-red-500"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {isOccupied ? (
                                                    // --- OCCUPIED CARD CONTENT ---
                                                    <div className="flex flex-col items-center justify-between w-full h-full p-2">
                                                        {/* Top: Time */}
                                                        <span className="text-[10px] font-medium opacity-80">
                                                            {activeOrder ? getElapsedTime(activeOrder.createdAt) : '0 Min'}
                                                        </span>

                                                        {/* Center: Table Name & Amount */}
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-lg font-bold leading-none">{table.label}</span>
                                                            <span className="text-sm font-bold">₹ {Math.round(activeOrder?.totalAmount || 0)}</span>
                                                        </div>

                                                        {/* Bottom: Actions */}
                                                        <div className="flex gap-2 mt-1 z-20" onClick={(e) => e.stopPropagation()}>
                                                            {/* Stop propagation so clicking buttons doesn't select table if we want separate actions */}
                                                            <button
                                                                onClick={() => {
                                                                    // Print Action
                                                                    alert(`Print Bill for ${table.label}`);
                                                                }}
                                                                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 shadow-sm"
                                                                title="Print"
                                                            >
                                                                <Printer className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => router.push(`/billing?tableId=${table.id}&tableName=${encodeURIComponent(table.label)}`)}
                                                                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 shadow-sm"
                                                                title="View/Edit"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // --- FREE TABLE CONTENT ---
                                                    <>
                                                        <span className="text-lg font-bold z-10">{table.label}</span>
                                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-medium z-10">
                                                            {table.capacity} Pax
                                                        </span>
                                                        {/* Hover Effect */}
                                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                                                    </>
                                                )}

                                                {/* Selection Checkmark on top of everything if needed */}
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full border border-white z-30"></div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <TableModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={editingTable ? handleUpdateTable : handleCreateTable}
                initialData={editingTable}
                title={editingTable ? "Edit Table" : "Add New Table"}
            />
        </div>
    );
}
