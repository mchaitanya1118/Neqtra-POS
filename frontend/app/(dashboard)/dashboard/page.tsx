"use client";

import { memo, useEffect, useState } from "react";
import {
    DollarSign,
    ShoppingBag,
    AlertTriangle,
    UtensilsCrossed,
    CalendarDays,
    TrendingUp,
    Wallet,
    RefreshCw,
    Plus,
    Users,
    ChevronRight,
    Activity,
    Clock,
    LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";
import { PnLCalendar } from "@/components/dashboard/PnLCalendar";
import { CloudNodeStatus } from "@/components/dashboard/CloudNodeStatus";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/useUIStore";
import apiClient from "@/lib/api";

interface DashboardMetrics {
    dailyRevenue: number;
    orderCount: number;
    lowStockCount: number;
    lowStockItems: Array<{ id: number, name: string, quantity: number }>;
    reservationCount: number;
    occupiedTables: number;
    totalDues: number;
    paymentStats: { method: string, total: number }[];
}

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { token, hasPermission } = useAuthStore();
    const { toggleSidebar } = useUIStore();
    const router = useRouter();

    useEffect(() => {
        if (!hasPermission('Dashboard')) {
            router.push('/billing');
        }
    }, [hasPermission, router]);

    const fetchMetrics = async () => {
        if (!token || !hasPermission('Dashboard')) return;
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get('/dashboard');
            setMetrics(res.data);
        } catch (e: any) {
            console.error("Failed to fetch dashboard metrics", e);
            if (e.response) {
                setError(`Server Error: ${e.response.status} ${e.response.statusText} - ${JSON.stringify(e.response.data)}`);
            } else {
                setError(`Network Error: ${e.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hasPermission('Dashboard')) {
            fetchMetrics();
        }
    }, [token, hasPermission]);

    if (!hasPermission('Dashboard')) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden relative flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#050505]/80 backdrop-blur-md border-b border-[#1A1E21] px-4 md:px-8 py-4 md:py-5 flex flex-wrap gap-4 items-center justify-between shrink-0">
                <div className="flex items-center gap-3 md:gap-4">
                    <button
                        onClick={toggleSidebar}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-[#1A1E21] flex items-center justify-center border border-[#2A2E31] group cursor-pointer hover:bg-[#2A2E31] transition-colors shrink-0"
                    >
                        <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6 text-primary group-hover:scale-110 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold font-serif italic tracking-tighter text-white">Dashboard</h1>
                        <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] shrink-0" />
                            <span className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-[0.2em] truncate relative top-[1px]">Live System Feed</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={fetchMetrics}
                        className="flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:px-5 md:py-2.5 bg-[#1A1E21] hover:bg-[#2A2E31] border border-[#2A2E31] rounded-full text-xs font-bold text-gray-400 hover:text-white transition-all group shrink-0"
                        title="Refresh Feed"
                    >
                        <RefreshCw className={cn("w-4 h-4 md:w-3.5 md:h-3.5 group-hover:rotate-180 transition-transform duration-500", loading && "animate-spin")} />
                        <span className="hidden md:inline tracking-widest uppercase">Refresh Feed</span>
                    </button>
                    <button
                        onClick={() => router.push('/billing')}
                        className="flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:px-6 md:py-2.5 bg-primary hover:bg-primary/80 text-primary-fg rounded-full text-xs font-bold shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_20%,transparent)] hover:shadow-[0_0_30px_color-mix(in_srgb,var(--primary)_40%,transparent)] transition-all transform hover:scale-105 active:scale-95 shrink-0"
                        title="New Order"
                    >
                        <Plus className="w-5 h-5 md:w-4 md:h-4" />
                        <span className="hidden md:inline tracking-widest uppercase">New Order</span>
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 custom-scrollbar">
                <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8 pb-12">

                    {loading && !metrics ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-40 bg-[#1A1E21] rounded-[32px] border border-[#2A2E31]" />
                            ))}
                        </div>
                    ) : metrics ? (
                        <>
                            {/* Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {hasPermission('Reports') && (
                                    <MetricCard
                                        title="Daily Revenue"
                                        value={`₹${metrics.dailyRevenue.toFixed(2)}`}
                                        icon={DollarSign}
                                        trend="+12% TODAY"
                                        iconColor="text-primary"
                                        iconBg="bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]"
                                        onClick={() => router.push('/reports')}
                                    />
                                )}
                                {hasPermission('Orders') && (
                                    <MetricCard
                                        title="Orders Today"
                                        value={metrics.orderCount.toString()}
                                        icon={ShoppingBag}
                                        trend="LIVE UPDATES"
                                        iconColor="text-blue-400"
                                        iconBg="bg-blue-500/10"
                                        onClick={() => router.push('/orders')}
                                    />
                                )}
                                {hasPermission('Table Services') && (
                                    <MetricCard
                                        title="Occupied Tables"
                                        value={metrics.occupiedTables.toString()}
                                        icon={UtensilsCrossed}
                                        trend="INSTANT OCCUPANCY"
                                        iconColor="text-amber-400"
                                        iconBg="bg-amber-500/10"
                                        onClick={() => router.push('/tables')}
                                    />
                                )}
                                {hasPermission('Dues') && (
                                    <MetricCard
                                        title="Total Dues"
                                        value={`₹${metrics.totalDues ? metrics.totalDues.toFixed(2) : '0.00'}`}
                                        icon={Wallet}
                                        trend="AWAITING SETTLEMENT"
                                        iconColor="text-red-400"
                                        iconBg="bg-red-500/10"
                                        onClick={() => router.push('/dues')}
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Main Column */}
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Critical Inventory */}
                                    {hasPermission('Inventory') && (
                                        <div className="bg-[#0D1212] border border-[#1A1E21] rounded-[24px] md:rounded-[32px] p-5 md:p-8 relative overflow-hidden group hover:border-primary/20 transition-all">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                                                <div className="flex items-center gap-4 md:gap-5">
                                                    <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                                                        <AlertTriangle className="w-7 h-7" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-2xl font-bold font-serif italic text-white tracking-tight">Critical Inventory</h2>
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">{metrics.lowStockCount} ITEMS BELOW THRESHOLD</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => router.push('/inventory')}
                                                    className="px-6 py-2.5 border border-[#2A2E31] bg-[#1A1E21] hover:bg-[#2A2E31] rounded-full text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-all"
                                                >
                                                    Manage Stock
                                                </button>
                                            </div>

                                            {metrics.lowStockItems.length === 0 ? (
                                                <div className="border border-dashed border-[#2A2E31] rounded-2xl p-10 text-center bg-[#1A1E21]/50">
                                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Inventory Status Healthy</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {metrics.lowStockItems.map(item => (
                                                        <div key={item.id} className="flex items-center justify-between p-5 bg-[#1A1E21]/50 hover:bg-[#1A1E21] border border-[#2A2E31] rounded-2xl transition-all cursor-pointer group/item">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-[#050505] flex items-center justify-center text-gray-600 border border-[#2A2E31] text-xs font-mono">
                                                                    #{item.id}
                                                                </div>
                                                                <span className="text-sm font-bold text-gray-300 group-hover/item:text-white transition-colors">{item.name}</span>
                                                            </div>
                                                            <span className="text-red-400 font-bold bg-red-500/10 px-4 py-2 rounded-full text-[10px] uppercase tracking-wider border border-red-500/20">
                                                                {item.quantity} units left
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Financial Performance / PnL */}
                                    {hasPermission('Reports') && (
                                        <div className="bg-[#0D1212] border border-[#1A1E21] rounded-[24px] md:rounded-[32px] p-5 md:p-8 overflow-x-auto">
                                            <PnLCalendar />
                                        </div>
                                    )}
                                </div>

                                {/* Sidebar Column */}
                                <div className="lg:col-span-1 space-y-8">
                                    {/* Cloud Node Status */}
                                    <CloudNodeStatus />

                                    {/* Execution Gateways */}
                                    <div className="bg-[#0D1212] border border-[#1A1E21] rounded-[24px] md:rounded-[32px] p-5 md:p-8">
                                        <h2 className="text-xl font-bold font-serif italic text-white tracking-tight mb-6 md:mb-8">Execution Gateways</h2>
                                        <div className="space-y-4">
                                            {hasPermission('Reservations') && (
                                                <ExecutionGatewayBtn
                                                    icon={Plus}
                                                    label="New Reservation"
                                                    onClick={() => router.push('/reservations')}
                                                />
                                            )}
                                            {hasPermission('Users') && (
                                                <ExecutionGatewayBtn
                                                    icon={Users}
                                                    label="Manage Staff"
                                                    onClick={() => router.push('/users')}
                                                />
                                            )}
                                            {hasPermission('Accounting') && (
                                                <ExecutionGatewayBtn
                                                    icon={Activity}
                                                    label="Daily Audit"
                                                    onClick={() => router.push('/accounting')}
                                                />
                                            )}
                                            {hasPermission('Menu') && (
                                                <ExecutionGatewayBtn
                                                    icon={UtensilsCrossed}
                                                    label="Update Menu"
                                                    onClick={() => router.push('/menu')}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                            <h3 className="text-xl font-bold text-white">Stream Interrupted</h3>
                            <p className="text-gray-500 text-sm mt-2">Failed to synchronize dashboard metrics.</p>
                            {error && (
                                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl max-w-lg mx-auto">
                                    <p className="text-red-400 font-mono text-xs">{error}</p>
                                </div>
                            )}
                            <button onClick={fetchMetrics} className="mt-6 px-6 py-2 bg-[#1A1E21] border border-[#2A2E31] rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#2A2E31] text-white transition-all">Retry Synchronization</button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

const MetricCard = memo(function MetricCard({ title, value, icon: Icon, trend, iconColor, iconBg, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className="bg-[#0D1212] border border-[#1A1E21] rounded-[24px] md:rounded-[32px] p-5 md:p-8 hover:border-[color-mix(in_srgb,var(--primary)_30%,transparent)] hover:shadow-[0_0_30px_color-mix(in_srgb,var(--primary)_5%,transparent)] transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between"
        >
            <div className="flex flex-wrap items-start justify-between gap-3 mb-6 md:mb-8 relative z-10">
                <div className={cn("w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all border border-white/5 shrink-0", iconBg, iconColor)}>
                    <Icon className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                {trend && (
                    <div className="px-3 py-1.5 rounded-full border border-[#2A2E31] bg-[#1A1E21]">
                        <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{trend}</span>
                    </div>
                )}
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-[0.2em]">{title}</p>
                <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-bold tracking-tighter text-white font-serif italic">{value}</h3>
                    <ChevronRight className="w-5 h-5 text-[#2A2E31] group-hover:text-primary transition-colors" />
                </div>
            </div>
        </div>
    );
});

const ExecutionGatewayBtn = memo(function ExecutionGatewayBtn({ icon: Icon, label, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 bg-[#1A1E21]/30 hover:bg-[#1A1E21] border border-[#2A2E31] hover:border-[color-mix(in_srgb,var(--primary)_30%,transparent)] rounded-2xl transition-all group"
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#050505] text-gray-400 group-hover:text-primary flex items-center justify-center border border-[#2A2E31] transition-colors">
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors tracking-wide">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#2A2E31] group-hover:text-primary transition-colors" />
        </button>
    );
});


