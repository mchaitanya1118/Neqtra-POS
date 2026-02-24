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
        <div className="min-h-screen bg-background p-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">SuperAdmin Command Center</h4>
                    </div>
                    <h1 className="text-5xl font-black text-foreground italic tracking-tighter">
                        Nexus <span className="text-primary">Control</span>
                    </h1>
                    <p className="text-muted font-bold mt-2">Global SaaS Orchestration & Infrastructure Monitoring</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="group flex items-center gap-3 px-6 py-4 bg-primary text-primary-foreground font-black rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-primary/20"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        Provision Tenant
                    </button>
                </div>
            </div>

            {/* Global Vitals */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
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

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1.5 bg-surface-light/30 backdrop-blur-xl w-fit rounded-2xl border border-surface-light mb-8">
                <TabButton active={activeTab === 'tenants'} onClick={() => setActiveTab('tenants')} icon={<Globe size={16} />} label="Tenants" />
                <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart3 size={16} />} label="Analytics" />
                <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon={<History size={16} />} label="Audit Logs" />
            </div>

            {/* Main Content Area */}
            <div className="bg-surface/30 backdrop-blur-3xl rounded-[2.5rem] border border-surface-light/50 overflow-hidden shadow-2xl shadow-black/20">
                {activeTab === 'tenants' && (
                    <div className="p-8">
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
        <div className="bg-surface/40 backdrop-blur-2xl p-6 rounded-[2rem] border border-surface-light/50 group hover:border-primary/30 transition-all duration-500 shadow-lg">
            <div className="flex justify-between items-start mb-6">
                <div className={cn("p-3 rounded-2xl border animate-pulse", colors[color as keyof typeof colors])}>
                    {icon}
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">{title}</p>
                </div>
            </div>
            <div>
                <h3 className="text-3xl font-black text-foreground mb-1">{value}</h3>
                <p className="text-[10px] font-bold text-muted uppercase tracking-tight">{label}</p>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted hover:text-foreground hover:bg-surface-light"
            )}
        >
            {icon}
            {label}
        </button>
    );
}
