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
    hasPermission: (permission: string) => boolean;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
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
            hasPermission: (perm) => {
                const user = get().user;
                if (!user) return false;

                // Case-insensitive Admin check
                const roleLower = user.role?.toLowerCase();
                if (roleLower === 'admin' || roleLower === 'superadmin') return true;

                // Explicit permission check from roleRel
                if (user.roleRel?.permissions.includes(perm)) return true;

                // Fallback for legacy users where roleRel might not be hydrated in localStorage yet
                if (roleLower === 'staff') {
                    const staffPerms = ['Orders', 'Table Services', 'Billing'];
                    if (staffPerms.includes(perm)) return true;
                }
                if (roleLower === 'cashier') {
                    const cashierPerms = ['Orders', 'Table Services', 'Billing', 'Dues'];
                    if (cashierPerms.includes(perm)) return true;
                }

                return false;
            },
        }),
        {
            name: 'auth-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
