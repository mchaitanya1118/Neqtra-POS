import apiClient from '@/lib/api';

export interface Tenant {
    id: string;
    name: string;
    status: 'ACTIVE' | 'SUSPENDED';
    subscriptionPlan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
    maxUsers: number;
    maxTables: number;
    createdAt: string;
}

export const AdminService = {
    getTenants: async () => {
        const { data } = await apiClient.get<Tenant[]>('/admin/tenants');
        return data;
    },

    createTenant: async (name: string, plan: string) => {
        const { data } = await apiClient.post<Tenant>('/admin/tenants', { name, plan });
        return data;
    },

    updateSubscription: async (id: string, plan: string) => {
        const { data } = await apiClient.patch<Tenant>(`/admin/tenants/${id}/plan`, { plan });
        return data;
    },

    toggleStatus: async (id: string) => {
        const { data } = await apiClient.patch<Tenant>(`/admin/tenants/${id}/status`, {});
        return data;
    },

    updateQuotas: async (id: string, quotas: { maxUsers?: number; maxTables?: number }) => {
        const { data } = await apiClient.patch<Tenant>(`/admin/tenants/${id}/quotas`, quotas);
        return data;
    },

    getStats: async () => {
        const { data } = await apiClient.get('/admin/stats/overview');
        return data;
    },

    deleteTenant: async (id: string) => {
        const { data } = await apiClient.delete(`/admin/tenants/${id}`);
        return data;
    }
};
