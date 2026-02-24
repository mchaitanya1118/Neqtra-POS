'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { SalesData } from '@/services/reports.service';

interface SalesChartProps {
    data: SalesData[];
}

export default function SalesChart({ data }: SalesChartProps) {
    return (
        <div className="h-80 w-full animate-in zoom-in duration-1000">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 10,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#69d7bd" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#69d7bd" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#888', fontWeight: 'bold' }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: '#888', fontWeight: 'bold' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value > 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                    />
                    <Tooltip
                        cursor={{ stroke: '#69d7bd', strokeWidth: 1, strokeDasharray: '4 4' }}
                        content={<CustomTooltip />}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#69d7bd"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        animationDuration={2000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface/90 backdrop-blur-xl p-4 rounded-2xl border border-surface-light shadow-2xl">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <p className="text-sm font-black text-foreground">
                        ₹{payload[0].value.toLocaleString()}
                    </p>
                </div>
                {payload[0].payload.orders && (
                    <p className="text-[10px] text-muted mt-2 font-bold">
                        {payload[0].payload.orders} Orders Received
                    </p>
                )}
            </div>
        );
    }
    return null;
}
