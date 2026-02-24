"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, TrendingUp } from "lucide-react";
import apiClient from "@/lib/api";
import { cn } from "@/lib/utils";

interface PnLData {
    date: string;
    revenue: number;
    expense: number;
    profit: number;
}

export function PnLCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [data, setData] = useState<PnLData[]>([]);
    const [loading, setLoading] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get(`/reports/pnl?year=${year}&month=${month}`);
                setData(res.data);
            } catch (e) {
                console.error("Failed to fetch PnL data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [year, month]);

    const handlePrev = () => {
        setCurrentDate(new Date(year, month - 2, 1));
    };

    const handleNext = () => {
        setCurrentDate(new Date(year, month, 1));
    };

    // Calendar generation
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 = Sunday

    const days = [];
    // Padding
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#69D7BD]/10 text-[#69D7BD] flex items-center justify-center border border-[#69D7BD]/20 shadow-[0_0_15px_rgba(105,215,189,0.1)]">
                        <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold font-serif italic tracking-tight text-white text-left">Daily Profit & Loss</h2>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">Financial Performance Stream</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-400 w-32 text-center uppercase tracking-widest bg-[#1A1E21] py-2.5 rounded-full border border-[#2A2E31]">
                        {currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                    </span>
                    <div className="flex gap-2">
                        <button onClick={handlePrev} className="p-2.5 bg-[#1A1E21] hover:bg-[#2A2E31] rounded-full text-gray-400 hover:text-white transition-all border border-[#2A2E31] active:scale-95 group">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <button onClick={handleNext} className="p-2.5 bg-[#1A1E21] hover:bg-[#2A2E31] rounded-full text-gray-400 hover:text-white transition-all border border-[#2A2E31] active:scale-95 group">
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#69D7BD] animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-px bg-[#2A2E31] rounded-2xl overflow-hidden border border-[#2A2E31]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="bg-[#1A1E21] p-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {d}
                        </div>
                    ))}

                    {days.map((day, i) => {
                        if (!day) return <div key={`pad-${i}`} className="bg-[#0D1212]/80 h-28" />;

                        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayData = data.find(d => d.date === dateStr);
                        const profit = dayData ? dayData.profit : 0;
                        const hasData = dayData && (dayData.revenue > 0 || dayData.expense > 0);
                        const isToday = dateStr === new Date().toISOString().split('T')[0];

                        return (
                            <div key={day} className="bg-[#0D1212]/60 h-28 p-3 flex flex-col justify-between hover:bg-[#1A1E21] transition-colors group cursor-default">
                                <span className={cn(
                                    "text-xs font-bold transition-colors",
                                    isToday ? "text-[#050505] bg-[#69D7BD] w-6 h-6 flex items-center justify-center rounded-full" : "text-gray-600 group-hover:text-gray-400"
                                )}>
                                    {day}
                                </span>

                                {hasData && (
                                    <div className="flex flex-col items-end">
                                        <span className={cn("text-sm font-bold tracking-tight", profit >= 0 ? "text-[#69D7BD]" : "text-red-400")}>
                                            {profit >= 0 ? '+' : ''}{profit.toFixed(0)}
                                        </span>
                                        <div className="flex flex-col items-end gap-0.5 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            {dayData.revenue > 0 && (
                                                <span className="text-[9px] text-gray-500 flex items-center gap-1 font-mono">
                                                    INC <span className="text-gray-300">{dayData.revenue.toFixed(0)}</span>
                                                </span>
                                            )}
                                            {dayData.expense > 0 && (
                                                <span className="text-[9px] text-gray-500 flex items-center gap-1 font-mono">
                                                    EXP <span className="text-red-400/80">{dayData.expense.toFixed(0)}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

