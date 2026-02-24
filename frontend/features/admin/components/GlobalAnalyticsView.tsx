'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { TrendingUp, Users, Globe, Zap } from 'lucide-react';

interface GlobalAnalyticsViewProps {
    stats: any;
}

export default function GlobalAnalyticsView({ stats }: GlobalAnalyticsViewProps) {
    if (!stats) return null;

    const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];

    return (
        <div className="p-8 space-y-12 animate-in slide-in-from-bottom-4 duration-700">
            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-surface/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-surface-light shadow-xl">
                    <h3 className="text-sm font-black text-muted uppercase tracking-widest mb-8">Ecosystem Composition</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.planDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="count"
                                    nameKey="plan"
                                >
                                    {stats.planDistribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '1rem', border: 'none', background: 'rgba(0,0,0,0.8)', color: 'white' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-surface/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-surface-light shadow-xl">
                    <h3 className="text-sm font-black text-muted uppercase tracking-widest mb-8">Node Density</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.planDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="plan" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ borderRadius: '1rem', border: 'none', background: 'rgba(0,0,0,0.8)', color: 'white' }}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {stats.planDistribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Insights Banner */}
            <div className="bg-primary/10 border border-primary/20 p-8 rounded-[2rem] flex items-center gap-6">
                <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-xl">
                    <TrendingUp className="w-8 h-8" />
                </div>
                <div>
                    <h4 className="text-xl font-black text-foreground">Strategic Growth Identified</h4>
                    <p className="text-muted font-bold">Node activation velocity has increased by 12% in the last 24h cycle.</p>
                </div>
            </div>
        </div>
    );
}
