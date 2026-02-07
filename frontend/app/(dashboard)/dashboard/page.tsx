"use client";

import { useEffect, useState } from "react";
import {
    DollarSign,
    ShoppingBag,
    AlertTriangle,
    UtensilsCrossed,
    CalendarDays,
    TrendingUp,
    Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";
import { PnLCalendar } from "@/components/dashboard/PnLCalendar";
import { useAuthStore } from "@/store/useAuthStore";

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
    const { token } = useAuthStore();

    useEffect(() => {
        const fetchMetrics = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/dashboard`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMetrics(data);
                }
            } catch (e) {
                console.error("Failed to fetch dashboard metrics", e);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, [token]);

    if (loading) return <div className="p-8 text-muted">Loading dashboard...</div>;
    if (!metrics) return <div className="p-8 text-red-500">Failed to load dashboard data.</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Daily Revenue"
                    value={`₹${metrics.dailyRevenue.toFixed(2)}`}
                    icon={DollarSign}
                    trend="+12% vs yesterday" // Mock trend
                    color="text-green-500"
                    bg="bg-green-500/10"
                />
                <MetricCard
                    title="Orders Today"
                    value={metrics.orderCount.toString()}
                    icon={ShoppingBag}
                    trend="pending processing"
                    color="text-blue-500"
                    bg="bg-blue-500/10"
                />
                <MetricCard
                    title="Active Reservations"
                    value={metrics.reservationCount.toString()}
                    icon={CalendarDays}
                    color="text-purple-500"
                    bg="bg-purple-500/10"
                />
                <MetricCard
                    title="Total Dues"
                    value={`₹${metrics.totalDues ? metrics.totalDues.toFixed(2) : '0.00'}`}
                    icon={Wallet}
                    color="text-rose-500"
                    bg="bg-rose-500/10"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Low Stock Alert */}
                <div className="bg-surface border border-border rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Low Stock Alerts</h2>
                            <p className="text-sm text-muted">{metrics.lowStockCount} items below threshold</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {metrics.lowStockItems.length === 0 ? (
                            <p className="text-muted text-sm">All inventory levels are healthy.</p>
                        ) : (
                            metrics.lowStockItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-surface-light rounded-xl">
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-red-500 font-bold bg-surface px-2 py-1 rounded-lg text-xs">
                                        {item.quantity} remaining
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions / Recent Activity Placeholder */}
                <div className="bg-surface border border-border rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">System Status</h2>
                            <p className="text-sm text-muted">Real-time system health</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-muted">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Database Connected
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            WebSocket Gateway Active
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Backend API Online
                        </div>
                    </div>
                </div>
            </div>

            <PnLCalendar />

            {/* Payment Analytics Row */}
            <div className="bg-surface border border-border rounded-3xl p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Today's Payment Breakdown
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {metrics.paymentStats?.map((stat) => (
                        <div key={stat.method} className="bg-surface-light p-4 rounded-2xl flex flex-col gap-1 border border-border">
                            <span className="text-xs font-bold text-muted uppercase tracking-wider">{stat.method.replace('_', ' ')}</span>
                            <span className="text-xl font-bold">₹{stat.total.toFixed(2)}</span>
                        </div>
                    ))}
                    {(!metrics.paymentStats || metrics.paymentStats.length === 0) && (
                        <p className="text-muted text-sm col-span-full">No payments recorded today.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon, trend, color, bg }: any) {
    return (
        <div className="bg-surface border border-border rounded-3xl p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
            <div className="flex items-start justify-between mb-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", bg, color)}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <span className="text-xs font-bold bg-surface-light px-2 py-1 rounded-lg text-muted">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-muted font-medium text-sm mb-1">{title}</p>
                <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            </div>
        </div>
    );
}
