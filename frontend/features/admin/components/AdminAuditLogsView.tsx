'use client';

import { useEffect, useState } from 'react';
import { History, Shield, Activity, User } from 'lucide-react';
import apiClient from '@/lib/api';

export default function AdminAuditLogsView() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/admin/audit-logs')
            .then(res => setLogs(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-20 text-center animate-pulse">Scanning audit pipeline...</div>;

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Security Intelligence</h3>
                    <h2 className="text-2xl font-black text-foreground italic">SuperAdmin Activity Feed</h2>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Live Monitoring</span>
                </div>
            </div>

            <div className="space-y-4">
                {logs.map((log: any) => (
                    <div key={log.id} className="group flex items-center gap-6 bg-surface-light/20 p-6 rounded-3xl border border-surface-light hover:border-primary/30 transition-all">
                        <div className="p-3 bg-background rounded-2xl border border-surface-light text-muted group-hover:text-primary transition-colors">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">
                                    {log.action}
                                </span>
                                <span className="text-[10px] font-bold text-muted uppercase tracking-tight">
                                    {new Date(log.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-foreground">
                                <User className="w-3 h-3 inline mr-1 opacity-50" />
                                <span className="text-muted">Admin:</span> {log.admin?.name || 'Global System'}
                            </p>
                            {log.details && (
                                <p className="text-[10px] text-muted font-bold mt-2 font-mono bg-black/20 p-2 rounded-lg">
                                    {JSON.stringify(log.details)}
                                </p>
                            )}
                        </div>
                    </div>
                ))}

                {logs.length === 0 && (
                    <div className="py-24 text-center border-2 border-dashed border-surface-light rounded-[3rem]">
                        <p className="text-muted font-black tracking-widest uppercase">No security events intercepted</p>
                    </div>
                )}
            </div>
        </div>
    );
}
