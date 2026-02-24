'use client';

import { useState } from 'react';
import { Tenant, AdminService } from '@/services/admin.service';
import { X, Users, LayoutGrid, Save, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuotaManagerModalProps {
    tenant: Tenant | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function QuotaManagerModal({ tenant, isOpen, onClose, onSuccess }: QuotaManagerModalProps) {
    // Note: The Tenant type might not have maxUsers/maxTables yet in frontend interfaces,
    // we should ensure it does or cast it.
    const [maxUsers, setMaxUsers] = useState(10);
    const [maxTables, setMaxTables] = useState(20);
    const [loading, setLoading] = useState(false);

    // Sync quotas when tenant changes
    useState(() => {
        if (tenant) {
            setMaxUsers((tenant as any).maxUsers || 10);
            setMaxTables((tenant as any).maxTables || 20);
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant) return;

        setLoading(true);
        try {
            await AdminService.updateQuotas(tenant.id, { maxUsers, maxTables });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to update quotas:', error);
            alert('Failed to update quotas in global infrastructure.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !tenant) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="bg-surface/60 backdrop-blur-3xl w-full max-w-lg rounded-[3rem] border border-surface-light overflow-hidden shadow-2xl relative">
                <div className="p-12">
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 p-3 rounded-full bg-surface-light border border-surface-light/50 text-muted hover:text-foreground transition-all"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-amber-500/20 rounded-2xl border border-amber-500/30">
                            <ShieldAlert className="w-8 h-8 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-foreground italic tracking-tighter">Quota Override</h2>
                            <p className="text-muted font-bold text-sm">Modify resource gates for {tenant.name}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">
                                    <Users className="w-3 h-3" /> Max Human Resources (Users)
                                </label>
                                <input
                                    type="number"
                                    value={maxUsers}
                                    onChange={(e) => setMaxUsers(parseInt(e.target.value))}
                                    className="w-full bg-background/50 border border-surface-light p-6 rounded-2xl outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-xl font-black"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">
                                    <LayoutGrid className="w-3 h-3" /> Max Pos Nodes (Tables)
                                </label>
                                <input
                                    type="number"
                                    value={maxTables}
                                    onChange={(e) => setMaxTables(parseInt(e.target.value))}
                                    className="w-full bg-background/50 border border-surface-light p-6 rounded-2xl outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-xl font-black"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-amber-500 text-white p-6 rounded-3xl font-black text-xl uppercase tracking-widest shadow-2xl shadow-amber-500/30 hover:scale-[1.02] transition-all disabled:opacity-50"
                            >
                                {loading ? 'Propagating Quotas...' : 'Authorize Override'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
