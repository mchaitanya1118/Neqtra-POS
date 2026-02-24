'use client';

import { useState } from 'react';
import { AdminService } from '@/services/admin.service';
import { X, Globe, Shield, Rocket, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateTenantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateTenantModal({ isOpen, onClose, onSuccess }: CreateTenantModalProps) {
    const [name, setName] = useState('');
    const [plan, setPlan] = useState('BASIC');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await AdminService.createTenant(name, plan);
            onSuccess();
            onClose();
            setName('');
            setPlan('BASIC');
        } catch (error) {
            console.error('Failed to create tenant:', error);
            alert('Failed to provision tenant database. Check system logs.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="bg-surface/60 backdrop-blur-3xl w-full max-w-2xl rounded-[3rem] border border-surface-light overflow-hidden shadow-2xl relative">
                <div className="p-12">
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 p-3 rounded-full bg-surface-light border border-surface-light/50 text-muted hover:text-foreground transition-all"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-primary/20 rounded-2xl border border-primary/30">
                            <Rocket className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-foreground italic tracking-tighter">Deploy New Node</h2>
                            <p className="text-muted font-bold text-sm">Provision isolated database and infrastructure</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">Internal Organization Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Acme Corp Phoenix"
                                className="w-full bg-background/50 border border-surface-light p-6 rounded-2xl outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-lg font-bold placeholder:opacity-20"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">Strategic Deployment Plan</label>
                            <div className="grid grid-cols-2 gap-4">
                                <PlanOption
                                    selected={plan === 'FREE'}
                                    onClick={() => setPlan('FREE')}
                                    title="Standard"
                                    desc="Basic POS capability"
                                />
                                <PlanOption
                                    selected={plan === 'BASIC'}
                                    onClick={() => setPlan('BASIC')}
                                    title="Performance"
                                    desc="High velocity sales"
                                />
                                <PlanOption
                                    selected={plan === 'PRO'}
                                    onClick={() => setPlan('PRO')}
                                    title="Elite"
                                    desc="Full analytical suite"
                                />
                                <PlanOption
                                    selected={plan === 'ENTERPRISE'}
                                    onClick={() => setPlan('ENTERPRISE')}
                                    title="Omni-Channel"
                                    desc="Multi-region scale"
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-primary-foreground p-6 rounded-3xl font-black text-xl uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                {loading ? 'Initializing Global Infrastructure...' : 'Deploy Ecosystem'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function PlanOption({ selected, onClick, title, desc }: any) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "p-6 rounded-2xl border cursor-pointer transition-all duration-300",
                selected ? "bg-primary/10 border-primary/50 text-foreground" : "bg-background/30 border-surface-light text-muted hover:border-primary/20"
            )}
        >
            <h4 className="font-black text-sm uppercase tracking-tight mb-1">{title}</h4>
            <p className="text-[10px] font-bold opacity-60 leading-tight">{desc}</p>
        </div>
    );
}
