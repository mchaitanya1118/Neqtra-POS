import { create } from 'zustand';
import { API_URL } from '@/lib/config';

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
            const response = await fetch(`${API_URL}/users`);
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            set({ users: data, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    addUser: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add user');
            }
            // Refresh list
            await get().fetchUsers();
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    updateUser: async (id, userData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update user');
            }
            await get().fetchUsers();
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    deleteUser: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/users/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete user');
            await get().fetchUsers();
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    fetchRoles: async () => {
        try {
            const response = await fetch(`${API_URL}/roles`);
            if (!response.ok) throw new Error('Failed to fetch roles');
            const data = await response.json();
            set({ roles: data });
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    },

    addRole: async (roleData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/roles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roleData),
            });
            if (!response.ok) throw new Error('Failed to add role');
            await get().fetchRoles();
            set({ isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    updateRole: async (id, roleData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/roles/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roleData),
            });
            if (!response.ok) throw new Error('Failed to update role');
            await get().fetchRoles();
            set({ isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    deleteRole: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/roles/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to delete role');
            }
            await get().fetchRoles();
            set({ isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },
}));
