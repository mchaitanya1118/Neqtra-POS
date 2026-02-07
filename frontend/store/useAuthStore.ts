import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
    id: number;
    name: string;
    role: string;
};

type AuthState = {
    user: User | null;
    token: string | null;
    login: (credentials: { passcode?: string; username?: string; password?: string }) => Promise<User | null>;
    logout: () => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
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
                        return null;
                    }

                    const data = await response.json();
                    set({ user: data.user, token: data.access_token });
                    return data.user;
                } catch (error) {
                    console.error('Login error:', error);
                    return null;
                }
            },
            logout: () => set({ user: null, token: null }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
