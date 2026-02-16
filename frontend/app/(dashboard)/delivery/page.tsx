"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Truck,
    Bike,
    CheckCircle2,
    Plus,
    Search,
    Download,
    X,
    User,
    Phone,
    Navigation,
    LayoutGrid,
    History,
    Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDeliveryStore, Delivery } from "@/store/useDeliveryStore";
import { DeliveryCard } from "@/components/delivery/DeliveryCard";

export default function DeliveryPage() {
    const { deliveries, isLoading, fetchDeliveries, updateDelivery, deleteDelivery } = useDeliveryStore();
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [search, setSearch] = useState("");
    const router = useRouter();

    // Driver Modal State
    const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
    const [driverForm, setDriverForm] = useState({ name: "", phone: "" });

    useEffect(() => {
        fetchDeliveries();
        const interval = setInterval(fetchDeliveries, 30000); // Polling
        return () => clearInterval(interval);
    }, [fetchDeliveries]);

    const handleAssignDriver = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDelivery) return;

        try {
            await updateDelivery(selectedDelivery.id, {
                driverName: driverForm.name,
                driverPhone: driverForm.phone,
                status: 'ASSIGNED'
            });
            setIsDriverModalOpen(false);
            setDriverForm({ name: "", phone: "" });
            setSelectedDelivery(null);
        } catch (e) {
            console.error("Failed to assign driver:", e);
        }
    };

    const openDriverModal = (delivery: Delivery) => {
        setSelectedDelivery(delivery);
        setDriverForm({
            name: delivery.driverName || "",
            phone: delivery.driverPhone || ""
        });
        setIsDriverModalOpen(true);
    };

    const filteredDeliveries = useMemo(() => {
        return deliveries
            .filter(d => {
                const isHistory = ['DELIVERED', 'CANCELLED'].includes(d.status);
                return activeTab === 'active' ? !isHistory : isHistory;
            })
            .filter(d =>
                d.order?.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
                d.driverName?.toLowerCase().includes(search.toLowerCase()) ||
                d.orderId.toString().includes(search) ||
                d.address.toLowerCase().includes(search.toLowerCase())
            )
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [deliveries, activeTab, search]);

    // Metrics
    const activeCount = useMemo(() => deliveries.filter(d => !['DELIVERED', 'CANCELLED'].includes(d.status)).length, [deliveries]);
    const deliveredTodayCount = useMemo(() =>
        deliveries.filter(d => d.status === 'DELIVERED' && new Date(d.updatedAt).toDateString() === new Date().toDateString()).length
        , [deliveries]);

    const handleExport = () => {
        const rows = deliveries.map(d => ({
            ID: d.id,
            OrderID: d.orderId,
            Customer: d.order?.customer?.name || 'Guest',
            Phone: d.order?.customer?.phone || '',
            Address: d.address,
            Driver: d.driverName || 'Unassigned',
            Status: d.status,
            Fee: d.deliveryFee,
            Total: d.order?.totalAmount,
            Date: new Date(d.createdAt).toLocaleString()
        }));

        const csvContent = "data:text/csv;charset=utf-8,"
            + Object.keys(rows[0]).join(",") + "\n"
            + rows.map(r => Object.values(r).join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `fleet_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 min-h-screen">
            {/* Premium Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/5">
                            <Navigation className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight dark:text-white">Delivery Fleet</h1>
                    </div>
                    <p className="text-muted font-medium ml-1">Real-time logistics and dispatch management.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex gap-4 p-1.5 bg-surface border border-surface-light rounded-[28px] shadow-sm">
                        <div className="px-6 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-[22px] flex items-center gap-3">
                            <Bike className="w-5 h-5 text-blue-500" />
                            <div>
                                <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">Ongoing</p>
                                <p className="text-xl font-black leading-none">{activeCount}</p>
                            </div>
                        </div>
                        <div className="px-6 py-2.5 bg-green-500/10 border border-green-500/20 rounded-[22px] flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <div>
                                <p className="text-[10px] font-black text-green-500/60 uppercase tracking-widest">Done Today</p>
                                <p className="text-xl font-black leading-none">{deliveredTodayCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-surface-light mx-2 hidden lg:block" />

                    <div className="flex gap-3">
                        <button
                            onClick={handleExport}
                            className="p-4 bg-surface border border-surface-light hover:border-primary/50 rounded-2xl text-muted hover:text-primary transition-all shadow-sm"
                            title="Export Fleet Data"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => router.push('/billing?type=delivery')}
                            className="bg-primary hover:bg-primary/90 text-black px-8 py-4 rounded-2xl text-sm font-black shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                        >
                            <Plus className="w-5 h-5" />
                            New Dispatch
                        </button>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-surface/50 backdrop-blur-md border border-surface-light p-3 rounded-[32px]">
                <div className="relative flex p-1.5 bg-surface-light/40 rounded-[24px] w-full md:w-auto">
                    {['active', 'history'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={cn(
                                "relative px-8 py-3.5 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all duration-300 z-10",
                                activeTab === tab ? "text-foreground" : "text-muted hover:text-foreground/70"
                            )}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="active-tab-bg"
                                    className="absolute inset-0 bg-surface-light border border-surface-light/50 shadow-xl rounded-[20px] -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <div className="flex items-center gap-2">
                                {tab === 'active' ? <Truck className="w-4 h-4" /> : <History className="w-4 h-4" />}
                                {tab === 'active' ? "Fleet Monitor" : "Log History"}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 bg-surface-light/40 border border-surface-light/50 px-5 py-3 rounded-[24px] w-full md:w-[400px] focus-within:ring-2 ring-primary/20 focus-within:bg-surface-light transition-all group">
                    <Search className="w-5 h-5 text-muted group-focus-within:text-primary transition-colors" />
                    <input
                        className="bg-transparent text-sm font-bold focus:outline-none w-full placeholder:text-muted/40"
                        placeholder="Search fleet by order, customer, driver..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content Grid */}
            {isLoading && deliveries.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-[400px] bg-surface-light/20 animate-pulse rounded-[40px] border border-surface-light" />
                    ))}
                </div>
            ) : filteredDeliveries.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface border border-surface-light border-dashed rounded-[40px] p-24 text-center"
                >
                    <div className="w-24 h-24 bg-surface-light/50 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Package className="w-10 h-10 text-muted/30" />
                    </div>
                    <h2 className="text-2xl font-black mb-2 dark:text-white">Empty Dispatch</h2>
                    <p className="text-muted max-w-sm mx-auto">No orders match your current filter. Try searching for something else or create a new delivery order.</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredDeliveries.map((delivery) => (
                            <DeliveryCard
                                key={delivery.id}
                                delivery={delivery}
                                onAssign={openDriverModal}
                                onStatusUpdate={(id, status) => updateDelivery(id, { status } as any)}
                                onDelete={deleteDelivery}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Premium Driver Modal */}
            <AnimatePresence>
                {isDriverModalOpen && selectedDelivery && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDriverModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-surface border border-surface-light rounded-[40px] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-surface-light flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Truck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold dark:text-white">Assign Pilot</h2>
                                        <p className="text-xs text-muted">Dispatch Order #{selectedDelivery.orderId}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsDriverModalOpen(false)} className="p-3 hover:bg-surface-light rounded-full transition-colors text-muted hover:text-foreground">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleAssignDriver} className="p-8 space-y-6">
                                <div className="p-5 bg-surface-light/30 rounded-3xl border border-surface-light/50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Navigation className="w-4 h-4 text-primary" />
                                        <p className="text-xs font-black text-muted uppercase tracking-widest">Delivery Address</p>
                                    </div>
                                    <p className="text-sm font-bold leading-relaxed">{selectedDelivery.address}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Pilot Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                            <input
                                                autoFocus
                                                required
                                                value={driverForm.name}
                                                onChange={e => setDriverForm(p => ({ ...p, name: e.target.value }))}
                                                className="w-full pl-11 pr-4 py-4 bg-surface-light/30 border border-surface-light/50 rounded-2xl focus:outline-none focus:ring-2 ring-primary/20 focus:border-primary transition-all dark:text-white"
                                                placeholder="Enter driver's name..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Contact Details</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                            <input
                                                value={driverForm.phone}
                                                onChange={e => setDriverForm(p => ({ ...p, phone: e.target.value }))}
                                                className="w-full pl-11 pr-4 py-4 bg-surface-light/30 border border-surface-light/50 rounded-2xl focus:outline-none focus:ring-2 ring-primary/20 focus:border-primary transition-all dark:text-white"
                                                placeholder="Driver's phone (optional)"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsDriverModalOpen(false)}
                                        className="flex-1 px-8 py-4 bg-surface-light hover:bg-surface-light/80 text-foreground font-bold rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-8 py-4 bg-primary hover:bg-primary/90 text-black font-black rounded-2xl shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        Confirm Dispatch
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
