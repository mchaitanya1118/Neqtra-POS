"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTableStore } from "@/store/useTableStore";
import { useAuthStore } from "@/store/useAuthStore";
import {
    Plus,
    Search,
    RefreshCw,
    ShoppingBag,
    Truck,
    AlertCircle,
    Printer,
    Eye,
    Edit,
    Trash2,
    Activity,
    ChevronRight,
    SearchIcon,
    Filter
} from "lucide-react";
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
    const [filterStatus, setFilterStatus] = useState<'all' | 'free' | 'occupied'>('all');
    const [orders, setOrders] = useState<ActiveOrder[]>([]);
    const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
    const [now, setNow] = useState<number | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<{ id: number; label: string; capacity: number } | null>(null);

    // Fetch Tables & Orders
    useEffect(() => {
        setNow(Date.now());
        fetchTables();
        const fetchOrders = async () => {
            try {
                const res = await fetch(`${API_URL}/orders`);
                if (res.ok) {
                    const data = await res.json();
                    const active = data.filter((o: any) => ['PENDING', 'CONFIRMED', 'PARTIAL'].includes(o.status));
                    setOrders(active);
                }
            } catch (e) {
                console.error("Failed to fetch orders", e);
            }
        };

        fetchOrders();
        const interval = setInterval(() => {
            fetchTables();
            fetchOrders();
            setNow(Date.now());
        }, 10000);

        return () => clearInterval(interval);
    }, [fetchTables]);


    const handleTableClick = (table: any) => {
        if (user?.role === 'Waiter') {
            router.push(`/billing?tableName=${table.label}`);
            return;
        }

        if (selectedTableId === table.id) {
            setSelectedTableId(null);
        } else {
            setSelectedTableId(table.id);
        }
    };

    const handleCreateTable = async (label: string, capacity: number) => {
        try {
            const res = await fetch(`${API_URL}/tables`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label, capacity, status: 'FREE' })
            });
            if (res.ok) {
                fetchTables();
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
            }
        } catch (e) { console.error(e); }
    };

    const openCreateModal = () => {
        setEditingTable(null);
        setIsModalOpen(true);
    };

    const openEditModal = (table: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingTable({ id: table.id, label: table.label, capacity: table.capacity });
        setIsModalOpen(true);
    };

    const getActiveOrder = (tableName: string) => {
        return orders.find(o => o.tableName && o.tableName.toLowerCase() === tableName.toLowerCase());
    };

    const getElapsedTime = (createdAt: string) => {
        if (!now) return "0 Min";
        const start = new Date(createdAt).getTime();
        const diff = Math.max(0, Math.floor((now - start) / 60000));
        return `${diff} Min`;
    };

    const safeTables = Array.isArray(tables) ? tables : [];

    // Filtering Logic
    const filteredTables = safeTables.filter(t => {
        const matchesSearch = t.label.toLowerCase().includes(search.toLowerCase());
        const activeOrder = getActiveOrder(t.label);
        const isOccupied = t.status === 'OCCUPIED' || !!activeOrder;

        if (filterStatus === 'free') return matchesSearch && !isOccupied;
        if (filterStatus === 'occupied') return matchesSearch && isOccupied;
        return matchesSearch;
    });

    const sections: Record<string, typeof tables> = {
        "AC Restaurant": [],
        "Garden Area": [],
        "Non-AC Area": []
    };

    filteredTables.forEach(table => {
        const label = table.label.toLowerCase();
        if (label.startsWith('ac') || label.startsWith('a')) {
            sections["AC Restaurant"].push(table);
        } else if (label.startsWith('g') || label.startsWith('o')) {
            sections["Garden Area"].push(table);
        } else {
            sections["Non-AC Area"].push(table);
        }
    });

    if (isLoading) return <div className="p-8 text-primary flex items-center justify-center h-screen bg-background animate-pulse">Establishing Table Link...</div>;

    return (
        <div className="min-h-screen bg-background text-foreground font-sans overflow-hidden relative selection:bg-primary/30 flex flex-col">
            {/* Background Ambience */}
            <div className="fixed inset-0 bg-[url('/login-bg.png')] bg-cover bg-center opacity-10 pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-br from-background via-background/95 to-background/80 pointer-events-none" />

            {/* Header / Toolbar */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-surface-light px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 transition-all duration-300">
                <div className="flex items-center gap-6">
                    <h1 className="text-3xl font-bold font-serif italic tracking-tighter text-foreground">Table View</h1>

                    <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Live System Bridge</span>
                    </div>

                    <div className="relative group w-full sm:w-64">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                        <input
                            className="w-full pl-11 pr-4 py-2 bg-surface-light/50 border border-surface-light/50 focus:border-primary/50 rounded-full text-sm text-foreground placeholder:text-muted focus:outline-none transition-all ring-1 ring-transparent focus:ring-primary/20 backdrop-blur-sm"
                            placeholder="Find Table..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center bg-surface-light/50 backdrop-blur-sm border border-surface-light rounded-full p-1">
                        {(['all', 'free', 'occupied'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                                    filterStatus === s ? "bg-primary text-primary-fg shadow-lg shadow-primary/20" : "text-muted hover:text-foreground"
                                )}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => fetchTables()}
                        className="p-2.5 bg-surface-light hover:bg-surface border border-surface-light rounded-full text-muted transition-all active:scale-95"
                    >
                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                    </button>

                    <button
                        onClick={openCreateModal}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-fg rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all transform hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        Add Table
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto px-6 py-8 relative z-10 custom-scrollbar">
                <div className="max-w-[1920px] mx-auto space-y-12 pb-20">

                    {/* Legend: Floating Pill */}
                    <div className="flex items-center gap-6 bg-surface/30 backdrop-blur-md border border-surface-light rounded-full px-6 py-3 w-fit mx-auto mb-10 shadow-xl">
                        <LegendItem color="bg-surface-light" label="Free" />
                        <LegendItem color="bg-primary shadow-[0_0_8px_rgba(105,215,189,0.6)]" label="Occupied" />
                        <LegendItem color="bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" label="Printed" />
                        <LegendItem color="bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" label="Pending" />
                    </div>

                    {Object.entries(sections).map(([sectionName, sectionTables]) => (
                        <section key={sectionName} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {sectionTables.length > 0 && (
                                <>
                                    <div className="flex items-center gap-4 mb-8">
                                        <h2 className="text-2xl font-bold font-serif italic text-foreground tracking-tight">
                                            {sectionName}
                                        </h2>
                                        <div className="h-px bg-surface-light/50 flex-1" />
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-6">
                                        {sectionTables.map(table => {
                                            const isSelected = selectedTableId === table.id;
                                            const activeOrder = getActiveOrder(table.label);
                                            const isOccupied = table.status === 'OCCUPIED' || !!activeOrder;

                                            return (
                                                <div
                                                    key={table.id}
                                                    onClick={() => handleTableClick(table)}
                                                    className={cn(
                                                        "aspect-square rounded-[32px] flex flex-col items-center justify-center cursor-pointer transition-all duration-500 relative overflow-hidden group border",
                                                        isSelected ? "bg-primary/20 border-primary shadow-[0_0_30px_rgba(105,215,189,0.2)] scale-[1.05]" :
                                                            isOccupied ? "bg-surface/40 hover:bg-surface/60 border-primary/20 hover:border-primary/40 shadow-xl" :
                                                                "bg-surface/20 hover:bg-surface/40 border-surface-light hover:border-surface-light/80"
                                                    )}
                                                >
                                                    {/* Background Ambient Glow */}
                                                    {isOccupied && (
                                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                                                    )}

                                                    {/* Admin Overlay */}
                                                    {(user?.role === 'Admin' || user?.role === 'Manager') && (
                                                        <div className="absolute top-4 right-4 flex gap-2 z-50 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                                            <button
                                                                onClick={(e) => openEditModal(table, e)}
                                                                className="w-8 h-8 flex items-center justify-center bg-background/80 backdrop-blur rounded-full shadow-lg hover:bg-primary hover:text-primary-fg text-foreground transition-all border border-surface-light"
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </button>
                                                            {!isOccupied && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id, table.label); }}
                                                                    className="w-8 h-8 flex items-center justify-center bg-background/80 backdrop-blur rounded-full shadow-lg hover:bg-red-500/10 text-red-400 transition-all border border-surface-light"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {isOccupied ? (
                                                        <div className="flex flex-col items-center justify-between w-full h-full p-6 relative z-10">
                                                            {/* Live Badge */}
                                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/50 border border-primary/20 backdrop-blur-sm">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                                <span className="text-[9px] font-bold tracking-widest text-primary uppercase">
                                                                    {activeOrder ? getElapsedTime(activeOrder.createdAt) : 'LIVE'}
                                                                </span>
                                                            </div>

                                                            {/* Center Info */}
                                                            <div className="flex flex-col items-center gap-1 my-auto">
                                                                <span className="text-2xl font-bold font-serif italic tracking-tighter text-foreground leading-none">{table.label}</span>
                                                                <span className="text-sm font-bold text-primary/80">₹{Math.round(activeOrder?.totalAmount || 0)}</span>
                                                            </div>

                                                            {/* Action Row */}
                                                            <div className="flex gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    onClick={() => alert(`Printing Payload for ${table.label}`)}
                                                                    className="w-10 h-10 flex items-center justify-center bg-surface/50 hover:bg-surface border border-surface-light rounded-2xl text-muted hover:text-foreground transition-all hover:scale-110 active:scale-95"
                                                                >
                                                                    <Printer className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => router.push(`/billing?tableId=${table.id}&tableName=${encodeURIComponent(table.label)}`)}
                                                                    className="w-10 h-10 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-fg rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-110 active:scale-95"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center gap-2 relative z-10 text-center p-4">
                                                            <span className="text-2xl font-bold font-serif italic tracking-tighter text-muted transition-all group-hover:text-foreground group-hover:scale-110 duration-500">{table.label}</span>
                                                            <span className="text-[10px] uppercase tracking-widest text-muted/50 group-hover:text-primary transition-colors font-bold">
                                                                {table.capacity} PAX
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </section>
                    ))}

                    {filteredTables.length === 0 && (
                        <div className="h-96 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-surface/30 rounded-full flex items-center justify-center mb-6">
                                <Activity className="w-10 h-10 text-muted/50" />
                            </div>
                            <h3 className="text-2xl font-bold font-serif italic text-foreground mb-2">No Matching Patterns</h3>
                            <p className="text-muted max-w-sm mx-auto">Try adjusting your search or filters to find the tables you're looking for.</p>
                        </div>
                    )}
                </div>
            </main>

            <TableModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={editingTable ? handleUpdateTable : handleCreateTable}
                initialData={editingTable}
                title={editingTable ? "Edit Table Registry" : "New Table Registry"}
            />
        </div>
    );
}

function LegendItem({ color, label }: { color: string, label: string }) {
    return (
        <div className="flex items-center gap-2.5">
            <div className={cn("w-2.5 h-2.5 rounded-full", color)}></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</span>
        </div>
    );
}
