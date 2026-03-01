'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { AdminService, Tenant } from '@/services/admin.service';
import TenantList from './components/TenantList';
import CreateTenantModal from './components/CreateTenantModal';
import GlobalAnalyticsView from './components/GlobalAnalyticsView';
import AdminAuditLogsView from './components/AdminAuditLogsView';
import { Plus, Users, ShieldCheck, BarChart3, History, Globe, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api';

type Tab = 'tenants' | 'analytics' | 'audit';

export default function AdminDashboard() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [globalStats, setGlobalStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('tenants');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const router = useRouter();
    const { user, hasHydrated, hasPermission } = useAuthStore();

    useEffect(() => {
        if (!hasHydrated) return;

        const isSuperAdmin = hasPermission('SaaS Admin');
        if (user && !isSuperAdmin) {
            router.push('/dashboard');
            return;
        }

        if (user) {
            fetchAllData();
        }
    }, [user, hasHydrated, router]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [tenantsData, statsData] = await Promise.all([
                AdminService.getTenants(),
                AdminService.getStats()
            ]);
            setTenants(tenantsData);
            setGlobalStats(statsData);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-700 overflow-hidden">
            {/* Sticky Header Section */}
            <div className="shrink-0 px-4 md:px-8 pt-6 md:pt-8 pb-4 border-b border-surface-light/30 bg-background/80 backdrop-blur-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                            </div>
                            <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">SuperAdmin Command Center</h4>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-foreground italic tracking-tighter">
                            Nexus <span className="text-primary">Control</span>
                        </h1>
                        <p className="text-muted font-bold mt-2">Global SaaS Orchestration &amp; Infrastructure Monitoring</p>
                    </div>

                    <div className="flex items-center w-full md:w-auto mt-2 md:mt-0">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full md:w-auto group flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 bg-primary text-primary-foreground font-black rounded-xl md:rounded-2xl text-sm md:text-base hover:scale-105 transition-all shadow-xl shadow-primary/20"
                        >
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300 shrink-0" />
                            <span className="whitespace-nowrap">Provision Tenant</span>
                        </button>
                    </div>
                </div>

                {/* Global Vitals */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <StatusCard
                        title="Total Ecosystem"
                        value={globalStats?.totalTenants || tenants.length}
                        label="Active Nodes"
                        icon={<Globe className="w-5 h-5" />}
                        color="blue"
                    />
                    <StatusCard
                        title="System Users"
                        value={globalStats?.totalUsers || '...'}
                        label="Cross-Tenant"
                        icon={<Users className="w-5 h-5" />}
                        color="purple"
                    />
                    <StatusCard
                        title="Premium Ratio"
                        value={tenants.filter(t => t.subscriptionPlan !== 'FREE').length}
                        label="Monetized"
                        icon={<Crown className="w-5 h-5" />}
                        color="amber"
                    />
                    <StatusCard
                        title="System Health"
                        value="99.9%"
                        label="All Systems Nominal"
                        icon={<Zap className="w-5 h-5" />}
                        color="green"
                    />
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8">
                {/* Tab Navigation */}
                <div className="flex gap-2 p-1.5 bg-surface-light/30 backdrop-blur-xl w-full md:w-fit rounded-xl md:rounded-2xl border border-surface-light my-6 overflow-x-auto no-scrollbar">
                    <TabButton active={activeTab === 'tenants'} onClick={() => setActiveTab('tenants')} icon={<Globe size={16} className="shrink-0" />} label="Tenants" />
                    <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart3 size={16} className="shrink-0" />} label="Analytics" />
                    <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon={<History size={16} className="shrink-0" />} label="Audit Logs" />
                </div>

                {/* Main Content Area */}
                <div className="bg-surface/30 backdrop-blur-3xl rounded-[1.5rem] md:rounded-[2.5rem] border border-surface-light/50 overflow-hidden shadow-2xl shadow-black/20">
                    {activeTab === 'tenants' && (
                        <div className="p-4 md:p-8">
                            <TenantList tenants={tenants} onRefresh={fetchAllData} />
                        </div>
                    )}
                    {activeTab === 'analytics' && (
                        <GlobalAnalyticsView stats={globalStats} />
                    )}
                    {activeTab === 'audit' && (
                        <AdminAuditLogsView />
                    )}
                </div>
            </div>

            <CreateTenantModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchAllData}
            />
        </div>
    );
}

function StatusCard({ title, value, label, icon, color }: any) {
    const colors = {
        blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
        amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        green: "text-green-500 bg-green-500/10 border-green-500/20",
    };

    return (
        <div className="bg-surface/40 backdrop-blur-2xl p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-surface-light/50 group hover:border-primary/30 transition-all duration-500 shadow-lg">
            <div className="flex justify-between items-start mb-4 md:mb-6">
                <div className={cn("p-2 md:p-3 rounded-xl md:rounded-2xl border animate-pulse shrink-0", colors[color as keyof typeof colors])}>
                    {icon}
                </div>
                <div className="text-right overflow-hidden ml-2">
                    <p className="text-[8px] md:text-[10px] font-black text-muted uppercase tracking-widest truncate leading-tight mt-1">{title}</p>
                </div>
            </div>
            <div>
                <h3 className="text-xl md:text-3xl font-black text-foreground mb-0.5 md:mb-1 truncate">{value}</h3>
                <p className="text-[8px] md:text-[10px] font-bold text-muted uppercase tracking-tight truncate">{label}</p>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs uppercase tracking-wider md:tracking-widest transition-all whitespace-nowrap shrink-0",
                active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted hover:text-foreground hover:bg-surface-light"
            )}
        >
            {icon}
            {label}
        </button>
    );
}
