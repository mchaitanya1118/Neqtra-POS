'use client';

import { useState } from 'react';
import { Tenant, AdminService } from '@/services/admin.service';
import {
    MoreVertical, Shield, Ban, CheckCircle, Settings2,
    Trash2, Zap, Crown, UserPlus2, LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import QuotaManagerModal from './QuotaManagerModal';

interface TenantListProps {
    tenants: Tenant[];
    onRefresh: () => void;
}

export default function TenantList({ tenants, onRefresh }: TenantListProps) {
    const [updating, setUpdating] = useState<string | null>(null);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);

    const handleStatusToggle = async (tenant: Tenant) => {
        if (!confirm(`Are you sure you want to ${tenant.status === 'ACTIVE' ? 'suspend' : 'activate'} this tenant?`)) return;

        setUpdating(tenant.id);
        try {
            await AdminService.toggleStatus(tenant.id);
            onRefresh();
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setUpdating(null);
        }
    };

    const handleDelete = async (tenant: Tenant) => {
        if (!confirm(`Are you sure you want to PERMANENTLY delete the tenant "${tenant.name}" and all of their data? This action cannot be undone.`)) return;

        setUpdating(tenant.id);
        try {
            await AdminService.deleteTenant(tenant.id);
            onRefresh();
        } catch (error) {
            console.error('Failed to delete tenant:', error);
        } finally {
            setUpdating(null);
        }
    };

    const handlePlanChange = async (tenant: Tenant, newPlan: string) => {
        if (tenant.subscriptionPlan === newPlan) return;
        setUpdating(tenant.id);
        try {
            await AdminService.updateSubscription(tenant.id, newPlan);
            onRefresh();
        } catch (error) {
            console.error('Failed to update plan:', error);
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="space-y-4">
            {tenants.map((tenant) => (
                <div key={tenant.id} className="group relative bg-background/40 backdrop-blur-2xl p-4 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-surface-light hover:border-primary/20 transition-all duration-500 shadow-xl">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-8">
                        {/* Tenant Info */}
                        <div className="flex items-center gap-6">
                            <div className={cn(
                                "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border shadow-xl relative overflow-hidden group-hover:scale-105 transition-transform",
                                tenant.status === 'ACTIVE' ? "bg-primary/10 border-primary/20 text-primary" : "bg-red-500/10 border-red-500/20 text-red-500"
                            )}>
                                {tenant.subscriptionPlan === 'ENTERPRISE' ? <Crown className="w-8 h-8" /> : <LayoutGrid className="w-8 h-8" />}
                                {tenant.status === 'ACTIVE' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-ping" />}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground tracking-tight mb-1">{tenant.name}</h3>
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                                        tenant.status === 'ACTIVE' ? "bg-primary/10 border-primary/20 text-primary" : "bg-red-500/10 border-red-500/20 text-red-500"
                                    )}>
                                        {tenant.status}
                                    </span>
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-tight">ID: {tenant.id.slice(0, 8)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Mid Section: Quotas & Stats */}
                        <div className="grid grid-cols-2 gap-8 px-8 border-x border-surface-light/50 hidden xl:grid">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Infrastructure</p>
                                <div className="flex items-center gap-2 justify-center">
                                    <UserPlus2 className="w-4 h-4 text-primary" />
                                    <span className="text-lg font-black text-foreground">{(tenant as any).maxUsers || 10}</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Deployment</p>
                                <div className="flex items-center gap-2 justify-center">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    <span className="text-lg font-black text-foreground">{tenant.subscriptionPlan}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto lg:ml-auto mt-2 lg:mt-0">
                            <button
                                onClick={() => {
                                    setSelectedTenant(tenant);
                                    setIsQuotaModalOpen(true);
                                }}
                                className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5"
                                title="Manage Quotas"
                                disabled={updating === tenant.id}
                            >
                                <Settings2 size={18} />
                            </button>

                            <select
                                value={tenant.subscriptionPlan}
                                onChange={(e) => handlePlanChange(tenant, e.target.value)}
                                disabled={updating === tenant.id}
                                className="flex-1 lg:flex-none bg-surface/50 border border-surface-light text-foreground text-[10px] font-black font-serif uppercase tracking-widest rounded-xl focus:ring-primary focus:border-primary block p-3 outline-none"
                            >
                                <option value="FREE">Standard</option>
                                <option value="BASIC">Performance</option>
                                <option value="PRO">Elite</option>
                                <option value="ENTERPRISE">Omni-Channel</option>
                            </select>

                            <button
                                onClick={() => handleStatusToggle(tenant)}
                                disabled={updating === tenant.id}
                                className={cn(
                                    "p-4 rounded-xl border transition-all",
                                    tenant.status === 'ACTIVE' ? "bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white" : "bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white"
                                )}
                            >
                                {tenant.status === 'ACTIVE' ? <Ban size={18} /> : <CheckCircle size={18} />}
                            </button>

                            <button
                                onClick={() => handleDelete(tenant)}
                                disabled={updating === tenant.id}
                                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all underline-offset-4 decoration-2 decoration-red-500 font-bold text-xs uppercase tracking-widest"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {tenants.length === 0 && (
                <div className="py-24 text-center border-2 border-dashed border-surface-light rounded-[3rem]">
                    <div className="w-20 h-20 bg-surface-light rounded-full flex items-center justify-center mx-auto mb-6 opacity-20">
                        <Shield className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-foreground opacity-30 tracking-tighter italic">No Active Deployments Found</h2>
                    <p className="text-muted font-bold mt-2">Provision your first tenant to begin orchestration</p>
                </div>
            )}

            <QuotaManagerModal
                isOpen={isQuotaModalOpen}
                tenant={selectedTenant}
                onClose={() => {
                    setIsQuotaModalOpen(false);
                    setSelectedTenant(null);
                }}
                onSuccess={onRefresh}
            />
        </div>
    );
}
