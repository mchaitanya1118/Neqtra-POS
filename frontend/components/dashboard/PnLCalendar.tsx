"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/config";
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
                const res = await fetch(`${API_URL}/reports/pnl?year=${year}&month=${month}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (e) {
                console.error(e);
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
        <div className="bg-surface border border-border rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Daily Profit & Loss</h2>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-muted w-32 text-center">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex gap-1">
                        <button onClick={handlePrev} className="p-2 hover:bg-white/5 rounded-full text-muted hover:text-white">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={handleNext} className="p-2 hover:bg-white/5 rounded-full text-muted hover:text-white">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="bg-surface-light p-2 text-center text-xs font-bold text-muted uppercase">
                            {d}
                        </div>
                    ))}

                    {days.map((day, i) => {
                        if (!day) return <div key={`pad-${i}`} className="bg-surface h-24" />;

                        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayData = data.find(d => d.date === dateStr);
                        const profit = dayData ? dayData.profit : 0;
                        const hasData = dayData && (dayData.revenue > 0 || dayData.expense > 0);

                        return (
                            <div key={day} className="bg-surface h-24 p-2 flex flex-col justify-between hover:bg-white/5 transition-colors">
                                <span className={cn("text-xs font-bold", dateStr === new Date().toISOString().split('T')[0] ? "text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit" : "text-muted")}>
                                    {day}
                                </span>

                                {hasData && (
                                    <div className="flex flex-col items-end">
                                        <span className={cn("text-sm font-bold", profit >= 0 ? "text-green-500" : "text-red-500")}>
                                            {profit >= 0 ? '+' : ''}{profit.toFixed(0)}
                                        </span>
                                        <div className="flex flex-col items-end gap-0.5 mt-1">
                                            {dayData.revenue > 0 && (
                                                <span className="text-[10px] text-muted flex items-center gap-1">
                                                    INC: <span className="text-white">{dayData.revenue.toFixed(0)}</span>
                                                </span>
                                            )}
                                            {dayData.expense > 0 && (
                                                <span className="text-[10px] text-muted flex items-center gap-1">
                                                    EXP: <span className="text-red-400">{dayData.expense.toFixed(0)}</span>
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
