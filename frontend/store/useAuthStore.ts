import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
    id: number;
    name: string;
    role: string;
    roleRel?: {
        id: number;
        name: string;
        permissions: string[];
    };
};

type AuthState = {
    user: User | null;
    token: string | null;
    hasHydrated: boolean;
    login: (credentials: { passcode?: string; username?: string; password?: string }) => Promise<{ success: boolean; error?: string; user?: User }>;
    logout: () => void;
    setHasHydrated: (state: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            hasHydrated: false,
            login: async (credentials) => {
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(credentials),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        return {
                            success: false,
                            error: errorData.message || `Login failed: ${response.status} ${response.statusText}`
                        };
                    }

                    const data = await response.json();
                    set({ user: data.user, token: data.access_token });
                    return { success: true, user: data.user };
                } catch (error) {
                    console.error('Login error:', error);
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Network error or server unreachable'
                    };
                }
            },
            logout: () => set({ user: null, token: null }),
            setHasHydrated: (state) => set({ hasHydrated: state }),
        }),
        {
            name: 'auth-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
