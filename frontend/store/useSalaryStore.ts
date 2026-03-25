import { create } from 'zustand';
import apiClient from '@/lib/api';
import { User } from './useUserStore';

export interface Salary {
    id: number;
    userId: number;
    amount: number;
    paymentDate: string;
    paymentMonth: string;
    paymentMethod: string;
    type: 'REGULAR' | 'ADVANCE';
    referenceNote?: string;
    user?: User;
    createdAt: string;
}

interface SalaryStore {
    salaries: Salary[];
    isLoading: boolean;
    error: string | null;
    fetchSalaries: () => Promise<void>;
    addSalary: (data: Partial<Salary>) => Promise<void>;
    deleteSalary: (id: number) => Promise<void>;
}

export const useSalaryStore = create<SalaryStore>((set, get) => ({
    salaries: [],
    isLoading: false,
    error: null,

    fetchSalaries: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get('/salaries');
            set({ salaries: response.data, isLoading: false });
        } catch (error: any) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
        }
    },

    addSalary: async (data) => {
        set({ isLoading: true, error: null });
        try {
            await apiClient.post('/salaries', data);
            await get().fetchSalaries();
        } catch (error: any) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            throw error;
        }
    },

    deleteSalary: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await apiClient.delete(`/salaries/${id}`);
            await get().fetchSalaries();
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Failed to delete salary', isLoading: false });
            throw error;
        }
    }
}));
