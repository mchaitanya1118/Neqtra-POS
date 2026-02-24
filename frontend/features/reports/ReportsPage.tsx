'use client';

import { useEffect, useState } from 'react';
import { ReportsService, SalesData, TopItem, StaffPerformance, SalesSummary } from '@/services/reports.service';
import SalesChart from './components/SalesChart';
import TopItemsTable from './components/TopItemsTable';
import StaffPerformanceTable from './components/StaffPerformanceTable';
import { Calendar, DollarSign, ShoppingBag, CreditCard, TrendingUp, Lock, RefreshCcw, Download, Sparkles } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
    const { user, hasPermission } = useAuthStore();
    const router = useRouter();

    const isPro = user?.subscriptionPlan === 'PRO' || user?.subscriptionPlan === 'ENTERPRISE' || user?.subscriptionPlan === 'TRIAL' || user?.role === 'SuperAdmin' || user?.role === 'Admin';

    const [dateRange, setDateRange] = useState({
        start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });

    const [summary, setSummary] = useState<SalesSummary | null>(null);
    const [chartData, setChartData] = useState<SalesData[]>([]);
    const [topItems, setTopItems] = useState<TopItem[]>([]);
    const [staffPerf, setStaffPerf] = useState<StaffPerformance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [summaryData, chart, items, staff] = await Promise.all([
                ReportsService.getSales(dateRange.start, dateRange.end),
                ReportsService.getChartData(dateRange.start, dateRange.end),
                ReportsService.getTopItems(5, dateRange.start, dateRange.end),
                ReportsService.getStaffPerformance(dateRange.start, dateRange.end),
            ]);

            setSummary(summaryData);
            setChartData(chart);
            setTopItems(items);
            setStaffPerf(staff);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateRange({ ...dateRange, [e.target.name]: e.target.value });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Analytics Hub</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground font-serif italic">Reports & Insights</h1>
                    <p className="text-muted text-sm mt-3 max-w-md">Comprehensive overview of your business performance and growth metrics.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-surface/50 backdrop-blur-xl p-3 rounded-[28px] border border-surface-light shadow-2xl">
                    <div className="flex items-center gap-2 px-4 py-2 bg-background/50 rounded-2xl border border-surface-light/50">
                        <Calendar className="w-4 h-4 text-muted" />
                        <input
                            type="date"
                            name="start"
                            value={dateRange.start}
                            onChange={handleRangeChange}
                            className="bg-transparent text-xs font-bold outline-none text-foreground cursor-pointer"
                        />
                        <span className="text-muted mx-1">/</span>
                        <input
                            type="date"
                            name="end"
                            value={dateRange.end}
                            onChange={handleRangeChange}
                            className="bg-transparent text-xs font-bold outline-none text-foreground cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchData}
                            className="p-3 bg-surface-light hover:bg-surface-light/80 text-foreground rounded-2xl transition-all active:scale-95"
                        >
                            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                        </button>
                        <button
                            className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-fg rounded-2xl text-xs font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                        >
                            <Download className="w-4 h-4" /> Export
                        </button>
                    </div>
                </div>
            </div>

            {loading && !summary ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-surface/30 animate-pulse rounded-[32px]" />)}
                </div>
            ) : (
                <div className="relative">
                    {!isPro && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[8px] rounded-[40px] border border-surface-light/50 p-12 text-center overflow-hidden shadow-2xl">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-20">
                                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/30 blur-[120px] rounded-full" />
                                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
                            </div>

                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mb-6 mx-auto border border-primary/20 shadow-inner">
                                    <Lock className="w-10 h-10 text-primary" />
                                </div>
                                <h2 className="text-3xl font-bold text-foreground mb-4 font-serif italic">Unlock Premium Analytics</h2>
                                <p className="text-muted mb-8 max-w-md mx-auto leading-relaxed">
                                    Take the guesswork out of your business operations. Gain deep insights, track employee performance, and visualize trends with our Pro Analytics dashboard.
                                </p>
                                <button
                                    onClick={() => router.push('/subscription')}
                                    className="px-8 py-4 bg-primary text-primary-fg font-black rounded-full hover:shadow-[0_0_30px_rgba(105,215,189,0.4)] transition-all transform hover:scale-105 active:scale-95 text-sm uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-3 mx-auto"
                                >
                                    Step into Pro <TrendingUp className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={cn("space-y-8 transition-all duration-1000", !isPro && "opacity-20 pointer-events-none select-none grayscale-50")}>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <SummaryCard
                                title="Total Revenue"
                                value={`₹${summary?.totalRevenue.toLocaleString() || '0.00'}`}
                                icon={<DollarSign className="w-5 h-5" />}
                                color="green"
                                trend="+12.5% vs last month"
                            />
                            <SummaryCard
                                title="Net Orders"
                                value={summary?.orderCount.toLocaleString() || '0'}
                                icon={<ShoppingBag className="w-5 h-5" />}
                                color="blue"
                                trend="+8% daily avg"
                            />
                            <SummaryCard
                                title="Ticket Size"
                                value={`₹${summary?.orderCount ? (summary.totalRevenue / summary.orderCount).toFixed(0) : '0'}`}
                                icon={<Sparkles className="w-5 h-5" />}
                                color="purple"
                                trend="Stable this week"
                            />
                            <SummaryCard
                                title="Cash Liquidity"
                                value={`₹${summary?.paymentStats.find(p => p.method === 'CASH')?.total.toLocaleString() || '0.00'}`}
                                icon={<CreditCard className="w-5 h-5" />}
                                color="orange"
                                trend="65% of total sales"
                            />
                        </div>

                        {/* Middle Section: Chart and Payments */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-surface/40 backdrop-blur-md rounded-[40px] p-8 border border-surface-light shadow-xl">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-bold text-foreground font-serif italic">Revenue Trajectory</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Gross Sales</span>
                                        </div>
                                    </div>
                                </div>
                                <SalesChart data={chartData} />
                            </div>

                            <div className="bg-surface/40 backdrop-blur-md rounded-[40px] p-8 border border-surface-light shadow-xl flex flex-col">
                                <h3 className="text-xl font-bold text-foreground font-serif italic mb-8">Settlement Methods</h3>
                                <div className="space-y-6 flex-1">
                                    {summary?.paymentStats.map((stat, i) => {
                                        const percentage = summary.totalRevenue > 0 ? (stat.total / summary.totalRevenue) * 100 : 0;
                                        return (
                                            <div key={stat.method} className="group">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-bold text-muted uppercase tracking-wide group-hover:text-foreground transition-colors">{stat.method}</span>
                                                    <span className="text-sm font-bold text-foreground">₹{stat.total.toLocaleString()}</span>
                                                </div>
                                                <div className="w-full h-2 bg-background rounded-full overflow-hidden p-[1px]">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-1000 ease-out",
                                                            i === 0 ? "bg-primary" : i === 1 ? "bg-blue-500" : "bg-purple-500"
                                                        )}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {summary?.paymentStats.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full text-center text-muted gap-4">
                                            <CreditCard className="w-12 h-12 opacity-20" />
                                            <p className="text-sm">Waiting for transactions...</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-8 pt-8 border-t border-surface-light/50">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted font-bold uppercase tracking-wider">Total Settled</span>
                                        <span className="text-lg font-bold text-foreground">₹{summary?.totalRevenue.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* High Value Tables */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-surface/40 backdrop-blur-md rounded-[40px] p-8 border border-surface-light shadow-xl">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-bold text-foreground font-serif italic">Performance Stars</h3>
                                    <div className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">Top Selling</div>
                                </div>
                                <TopItemsTable items={topItems} />
                            </div>

                            <div className="bg-surface/40 backdrop-blur-md rounded-[40px] p-8 border border-surface-light shadow-xl">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-bold text-foreground font-serif italic">Talent Matrix</h3>
                                    <div className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-widest">Efficiency</div>
                                </div>
                                <StaffPerformanceTable staffList={staffPerf} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryCard({ title, value, icon, trend, color }: { title: string; value: string; icon: React.ReactNode; trend?: string; color: string }) {
    const colorClasses = {
        green: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10",
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-blue-500/10",
        purple: "bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-purple-500/10",
        orange: "bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-orange-500/10",
    }[color] || "bg-primary/10 text-primary border-primary/20 shadow-primary/10";

    return (
        <div className="group bg-surface/40 backdrop-blur-md p-7 rounded-[32px] border border-surface-light shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-4 rounded-2xl border transition-all duration-500 group-hover:scale-110 shadow-lg", colorClasses)}>
                    {icon}
                </div>
                {trend && (
                    <div className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded-lg">
                        <TrendingUp className="w-3 h-3" /> {trend.split(' ')[0]}
                    </div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-1">{title}</p>
                <h3 className="text-3xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{value}</h3>
                {trend && <p className="text-[10px] text-muted font-medium mt-2">{trend}</p>}
            </div>
        </div>
    );
}
