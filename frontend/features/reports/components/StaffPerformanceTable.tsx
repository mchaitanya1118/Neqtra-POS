'use client';

import { StaffPerformance } from '@/services/reports.service';
import { cn } from '@/lib/utils';
import { User, Trophy, Zap } from 'lucide-react';

interface StaffPerformanceTableProps {
    staffList: StaffPerformance[];
}

export default function StaffPerformanceTable({ staffList }: StaffPerformanceTableProps) {
    const maxRevenue = Math.max(...staffList.map(s => Number(s.revenue)), 1);

    return (
        <div className="space-y-4">
            {staffList.map((staff, index) => {
                const efficiency = (Number(staff.revenue) / maxRevenue) * 100;
                const isTop = index === 0 && staffList.length > 1;

                return (
                    <div key={index} className="group flex items-center gap-4 bg-background/30 p-4 rounded-3xl border border-surface-light/30 hover:bg-background/50 hover:border-blue-500/30 transition-all duration-300">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg transition-transform group-hover:scale-110",
                            isTop ? "bg-amber-500/20 border-amber-500/30 text-amber-500" : "bg-surface-light border-surface-light text-muted"
                        )}>
                            {isTop ? <Trophy className="w-6 h-6" /> : <User className="w-6 h-6" />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-black text-foreground truncate">{staff.staff || 'Registry User'}</h4>
                                {isTop && <span className="text-[8px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">Top Gun</span>}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-blue-500" />
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-tight">{staff.orders} Handles</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-sm font-black text-foreground">₹{Number(staff.revenue).toLocaleString()}</p>
                            <div className="flex justify-end mt-1">
                                <div className="w-16 h-1 bg-surface-light rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: `${efficiency}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            {staffList.length === 0 && (
                <div className="py-12 text-center text-muted border-2 border-dashed border-surface-light rounded-2xl">
                    <p className="text-sm font-bold uppercase tracking-widest">No Staff Activity</p>
                </div>
            )}
        </div>
    );
}
