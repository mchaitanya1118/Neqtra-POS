"use client";

import { useEffect, useState } from "react";
import { DollarSign, ShoppingBag, Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";

interface ReportData {
    totalRevenue: number;
    orderCount: number;
    paymentStats: { method: string, total: number }[];
    recentOrders: {
        id: number;
        tableName: string;
        totalAmount: string;
        status: string;
        createdAt: string;
    }[];
}

interface DuesTransaction {
    id: number;
    customerName: string;
    type: string;
    amount: number;
    description: string;
    date: string;
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [duesParams, setDuesParams] = useState<DuesTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (dateRange.start) params.append("start", new Date(dateRange.start).toISOString());
            if (dateRange.end) params.append("end", new Date(dateRange.end).toISOString());

            const res = await fetch(`${API_URL}/reports/sales?${params.toString()}`);
            const json = await res.json();
            setData(json);

            // Fetch Dues Transactions
            const resDues = await fetch(`${API_URL}/customers/report/transactions`);
            if (resDues.ok) {
                setDuesParams(await resDues.json());
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reports Dashboard</h1>

                {/* Date Filter ... */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-surface p-3 rounded-xl border border-border w-full lg:w-auto">
                    {/* Label */}
                    <div className="flex items-center gap-2 px-1 justify-center lg:justify-start shrink-0">
                        <Calendar className="w-4 h-4 text-muted" />
                        <span className="text-sm font-medium">Filter</span>
                    </div>

                    {/* Inputs Group */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
                        <input
                            type="date"
                            className="bg-surface-light border border-border rounded-lg px-2 py-1.5 text-sm w-full sm:w-40"
                            onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))}
                        />
                        <span className="text-muted hidden sm:inline">–</span>
                        <span className="text-muted text-xs sm:hidden">to</span>
                        <input
                            type="date"
                            className="bg-surface-light border border-border rounded-lg px-2 py-1.5 text-sm w-full sm:w-40"
                            onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))}
                        />
                    </div>

                    <button
                        onClick={fetchReports}
                        className="bg-primary text-primary-fg px-4 py-1.5 rounded-lg text-sm font-bold hover:brightness-90 transition-all w-full lg:w-auto shrink-0"
                    >
                        Apply
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-muted">Loading reports...</div>
            ) : (
                <>
                    {/* Summary Cards ... */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <div className="bg-surface border border-border p-5 md:p-6 rounded-2xl flex flex-col gap-2">
                            <span className="text-sm font-medium text-muted flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Total Revenue
                            </span>
                            <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                                ₹{data?.totalRevenue.toFixed(2)}
                            </span>
                        </div>

                        <div className="bg-surface border border-border p-5 md:p-6 rounded-2xl flex flex-col gap-2">
                            <span className="text-sm font-medium text-muted flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" /> Total Orders
                            </span>
                            <span className="text-3xl md:text-4xl font-bold text-foreground">
                                {data?.orderCount}
                            </span>
                        </div>

                        {/* Payment Method Breakdown */}
                        <div className="bg-surface border border-border p-5 md:p-6 rounded-2xl col-span-1 sm:col-span-2 md:col-span-2">
                            <h3 className="text-sm font-medium text-muted mb-4 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Revenue by Payment Method
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                                {data?.paymentStats?.map((stat) => (
                                    <div key={stat.method} className="bg-surface-light p-3 rounded-xl border border-border">
                                        <p className="text-[10px] md:text-xs text-muted font-bold uppercase mb-1 truncate">{stat.method.replace('_', ' ')}</p>
                                        <p className="text-base md:text-lg font-bold truncate">₹{stat.total.toFixed(2)}</p>
                                    </div>
                                ))}
                                {(!data?.paymentStats || data.paymentStats.length === 0) && (
                                    <p className="text-sm text-muted">No payment data available</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sales Report Table */}
                    <div className="bg-surface border border-border rounded-xl  md:rounded-2xl overflow-hidden mb-6 md:mb-8">
                        <div className="p-4 md:p-6 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold text-base md:text-lg">Sales History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-surface-light/50 text-muted border-b border-border">
                                    <tr>
                                        <th className="px-4 md:px-6 py-2 md:py-3 font-medium">Order ID</th>
                                        <th className="px-4 md:px-6 py-2 md:py-3 font-medium">Table</th>
                                        <th className="px-4 md:px-6 py-2 md:py-3 font-medium">Date</th>
                                        <th className="px-4 md:px-6 py-2 md:py-3 font-medium">Total</th>
                                        <th className="px-4 md:px-6 py-2 md:py-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {data?.recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-surface-light/30 transition-colors">
                                            <td className="px-4 md:px-6 py-3 md:py-4 font-medium">#{order.id}</td>
                                            <td className="px-4 md:px-6 py-3 md:py-4">{order.tableName}</td>
                                            <td className="px-4 md:px-6 py-3 md:py-4 text-muted">{new Date(order.createdAt).toLocaleString()}</td>
                                            <td className="px-4 md:px-6 py-3 md:py-4 font-bold">₹{Number(order.totalAmount).toFixed(2)}</td>
                                            <td className="px-4 md:px-6 py-3 md:py-4">
                                                <span className="px-2 py-0.5 rounded-full bg-surface-light text-xs font-medium border border-border">
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* NEW: Dues Report Table */}
                    <div className="bg-surface border border-border rounded-xl md:rounded-2xl overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-border flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-base md:text-lg">Dues & Settlements</h3>
                                <p className="text-xs md:text-sm text-muted">Recent customer transactions</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-surface-light/50 text-muted border-b border-border">
                                    <tr>
                                        <th className="px-4 md:px-6 py-2 md:py-3 font-medium">Date</th>
                                        <th className="px-4 md:px-6 py-2 md:py-3 font-medium">Customer</th>
                                        <th className="px-4 md:px-6 py-2 md:py-3 font-medium">Description</th>
                                        <th className="px-4 md:px-6 py-2 md:py-3 font-medium">Type</th>
                                        <th className="px-4 md:px-6 py-2 md:py-3 font-medium text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {duesParams.length === 0 ? (
                                        <tr><td colSpan={5} className="px-4 md:px-6 py-6 md:py-8 text-center text-muted">No transactions found</td></tr>
                                    ) : (
                                        duesParams.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-surface-light/30 transition-colors">
                                                <td className="px-4 md:px-6 py-3 md:py-4 text-muted">{new Date(tx.date).toLocaleString()}</td>
                                                <td className="px-4 md:px-6 py-3 md:py-4 font-medium">{tx.customerName}</td>
                                                <td className="px-4 md:px-6 py-3 md:py-4">{tx.description}</td>
                                                <td className="px-4 md:px-6 py-3 md:py-4">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-xs font-bold border",
                                                        tx.type === 'PAYMENT' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                                                    )}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className={cn(
                                                    "px-4 md:px-6 py-3 md:py-4 font-bold font-mono text-right",
                                                    tx.type === 'PAYMENT' ? "text-green-500" : "text-red-500"
                                                )}>
                                                    {tx.type === 'PAYMENT' ? '-' : '+'}₹{tx.amount.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
