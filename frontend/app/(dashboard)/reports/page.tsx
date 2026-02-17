"use client";

import { useEffect, useState, useMemo } from "react";
import { DollarSign, ShoppingBag, Calendar, Download, TrendingUp, CreditCard, PieChart } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart as RePieChart,
    Pie,
    Legend
} from "recharts";

interface ReportData {
    totalRevenue: number;
    orderCount: number;
    paymentStats: { method: string, total: number }[];
    recentOrders: any[];
}

interface ChartData {
    date: string;
    revenue: number;
    orders: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReportsPage() {
    const { hasPermission } = useAuthStore();
    const [data, setData] = useState<ReportData | null>(null);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'transactions'>('overview');

    // Default to last 30 days
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (dateRange.start) params.append("start", new Date(dateRange.start).toISOString());
            if (dateRange.end) params.append("end", new Date(dateRange.end).toISOString());

            const [resSales, resChart] = await Promise.all([
                fetch(`${API_URL}/reports/sales?${params.toString()}`),
                fetch(`${API_URL}/reports/chart-data?${params.toString()}`)
            ]);

            if (resSales.ok) setData(await resSales.json());
            if (resChart.ok) setChartData(await resChart.json());

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleDownload = () => {
        if (!data?.recentOrders) return;

        const headers = ["Order ID", "Date", "Table", "Total", "Status", "Payment Method"];
        const rows = data.recentOrders.map(o => [
            o.id,
            new Date(o.createdAt).toLocaleString(),
            o.tableName,
            o.totalAmount,
            o.status,
            o.paymentMethod || '-'
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `sales_report_${dateRange.start}_${dateRange.end}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Metrics
    const avgOrderValue = useMemo(() => {
        if (!data?.totalRevenue || !data?.orderCount) return 0;
        return data.totalRevenue / data.orderCount;
    }, [data]);

    const pieData = useMemo(() => {
        return data?.paymentStats.map(s => ({
            name: s.method.replace('_', ' '),
            value: s.total
        })) || [];
    }, [data]);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight font-serif italic">Business Intelligence</h1>
                    <p className="text-muted text-sm mt-2">Analyze revenue, track trends, and export data</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-surface-light">
                        <input
                            type="date"
                            className="bg-transparent border-none text-sm px-3 py-2 outline-none"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))}
                        />
                        <span className="text-muted">–</span>
                        <input
                            type="date"
                            className="bg-transparent border-none text-sm px-3 py-2 outline-none"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))}
                        />
                        <button
                            onClick={fetchReports}
                            disabled={!hasPermission('Reports')}
                            className="bg-primary text-white p-2 rounded-lg hover:brightness-90 disabled:opacity-50 transition-all shadow-sm"
                        >
                            <Calendar className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={handleDownload}
                        disabled={!hasPermission('Reports')}
                        className="bg-surface hover:bg-surface-light border border-surface-light disabled:opacity-30 text-foreground px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface border border-surface-light p-6 rounded-[24px] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-muted uppercase tracking-wider">Total Revenue</span>
                        </div>
                        <p className="text-4xl font-bold tracking-tight">₹{data?.totalRevenue.toLocaleString() || '0'}</p>
                    </div>
                </div>

                <div className="bg-surface border border-surface-light p-6 rounded-[24px] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-muted uppercase tracking-wider">Total Orders</span>
                        </div>
                        <p className="text-4xl font-bold tracking-tight">{data?.orderCount || 0}</p>
                    </div>
                </div>

                <div className="bg-surface border border-surface-light p-6 rounded-[24px] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-muted uppercase tracking-wider">Avg Order Value</span>
                        </div>
                        <p className="text-4xl font-bold tracking-tight">₹{avgOrderValue.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Charts & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-surface border border-surface-light rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" /> Revenue Trend
                    </h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12, fill: '#888' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#888' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `₹${val}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-surface border border-surface-light rounded-[32px] p-8 shadow-sm flex flex-col">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-primary" /> Payment Methods
                    </h3>
                    <div className="h-[300px] w-full mt-auto mb-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={pieData}
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-surface border border-surface-light rounded-[32px] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-surface-light">
                    <h3 className="text-xl font-bold">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-surface-light/30 text-muted border-b border-surface-light">
                            <tr>
                                <th className="px-8 py-4 font-bold uppercase text-[10px] tracking-wider">Order ID</th>
                                <th className="px-8 py-4 font-bold uppercase text-[10px] tracking-wider">Date</th>
                                <th className="px-8 py-4 font-bold uppercase text-[10px] tracking-wider">Table</th>
                                <th className="px-8 py-4 font-bold uppercase text-[10px] tracking-wider">Amount</th>
                                <th className="px-8 py-4 font-bold uppercase text-[10px] tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-light">
                            {data?.recentOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-surface-light/30 transition-colors">
                                    <td className="px-8 py-4 font-bold text-primary">#{order.id}</td>
                                    <td className="px-8 py-4 text-muted">{new Date(order.createdAt).toLocaleDateString()} <span className="text-xs opacity-50">{new Date(order.createdAt).toLocaleTimeString()}</span></td>
                                    <td className="px-8 py-4">{order.tableName}</td>
                                    <td className="px-8 py-4 font-bold">₹{Number(order.totalAmount).toFixed(2)}</td>
                                    <td className="px-8 py-4">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                            order.status === 'COMPLETED' ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"
                                        )}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
