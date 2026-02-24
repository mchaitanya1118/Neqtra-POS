import apiClient from '@/lib/api';

export interface SalesData {
    date: string;
    revenue: number;
    orders: number;
}

export interface SalesSummary {
    totalRevenue: number;
    orderCount: number;
    paymentStats: { method: string; total: number }[];
}

export interface TopItem {
    id: number;
    name: string;
    quantity: number;
    revenue: number;
}

export interface StaffPerformance {
    staff: string;
    orders: number;
    revenue: number;
}

export const ReportsService = {
    getSales: async (start?: string, end?: string) => {
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        const { data } = await apiClient.get<SalesSummary>(`/reports/sales?${params.toString()}`);
        return data;
    },

    getChartData: async (start?: string, end?: string) => {
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        const { data } = await apiClient.get<SalesData[]>(`/reports/chart-data?${params.toString()}`);
        return data;
    },

    getTopItems: async (limit: number = 10, start?: string, end?: string) => {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        const { data } = await apiClient.get<TopItem[]>(`/reports/items/top?${params.toString()}`);
        return data;
    },

    getStaffPerformance: async (start?: string, end?: string) => {
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        const { data } = await apiClient.get<StaffPerformance[]>(`/reports/staff/performance?${params.toString()}`);
        return data;
    }
};
