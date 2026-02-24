import { create } from 'zustand';
import apiClient from '@/lib/api';

export interface User {
    id: number;
    name: string;
    username?: string;
    passcode?: string;
    role: string;
    roleRel?: Role;
    createdAt: string;
    // password is never returned
}

export interface Role {
    id: number;
    name: string;
    permissions: string[];
    isSystem: boolean;
}

interface UserStore {
    users: User[];
    roles: Role[];
    isLoading: boolean;
    error: string | null;
    fetchUsers: () => Promise<void>;
    addUser: (userData: Partial<User> & { password?: string, roleId?: number }) => Promise<void>;
    updateUser: (id: number, userData: Partial<User> & { password?: string, roleId?: number }) => Promise<void>;
    deleteUser: (id: number) => Promise<void>;

    // Role Actions
    fetchRoles: () => Promise<void>;
    addRole: (roleData: Partial<Role>) => Promise<void>;
    updateRole: (id: number, roleData: Partial<Role>) => Promise<void>;
    deleteRole: (id: number) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
    users: [],
    roles: [],
    isLoading: false,
    error: null,

    fetchUsers: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get('/users');
            set({ users: response.data, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    addUser: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            await apiClient.post('/users', userData);
            // Refresh list
            await get().fetchUsers();
        } catch (error: any) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            throw error;
        }
    },

    updateUser: async (id, userData) => {
        set({ isLoading: true, error: null });
        try {
            await apiClient.patch(`/users/${id}`, userData);
            await get().fetchUsers();
        } catch (error: any) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            throw error;
        }
    },

    deleteUser: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await apiClient.delete(`/users/${id}`);
            await get().fetchUsers();
        } catch (error: any) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    fetchRoles: async () => {
        try {
            const response = await apiClient.get('/roles');
            set({ roles: response.data });
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    },

    addRole: async (roleData) => {
        set({ isLoading: true, error: null });
        try {
            await apiClient.post('/roles', roleData);
            await get().fetchRoles();
            set({ isLoading: false });
        } catch (error: any) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            throw error;
        }
    },

    updateRole: async (id, roleData) => {
        set({ isLoading: true, error: null });
        try {
            await apiClient.patch(`/roles/${id}`, roleData);
            await get().fetchRoles();
            set({ isLoading: false });
        } catch (error: any) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            throw error;
        }
    },

    deleteRole: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await apiClient.delete(`/roles/${id}`);
            await get().fetchRoles();
            set({ isLoading: false });
        } catch (error: any) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            throw error;
        }
    },
}));
