"use client";

import React, { useState, useEffect } from 'react';
import { User, Delete, ArrowLeft, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
    const [passcode, setPasscode] = useState('');
    const [activeTab, setActiveTab] = useState<'login' | 'passcode'>('passcode');
    const router = useRouter();

    const { login, user, hasHydrated } = useAuthStore();
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [tenantName, setTenantName] = useState<string | null>(null);

    useEffect(() => {
        if (hasHydrated && user) {
            let target = '/billing';
            if (user.role === 'Waiter') target = '/tables';
            if (user.role === 'SuperAdmin' || user.roleRel?.name === 'SuperAdmin') target = '/admin';
            router.replace(target);
        }
    }, [user, hasHydrated, router]);

    useEffect(() => {
        const fetchTenantContext = async () => {
            if (typeof window === 'undefined') return;

            const hostname = window.location.hostname;
            const parts = hostname.split('.');

            // Handle nested subdomains like tenant.pos.neqtra.com
            const baseDomain = 'pos.neqtra.com';
            let subdomain = null;

            if (hostname.endsWith(baseDomain) && hostname !== baseDomain) {
                subdomain = hostname.replace(`.${baseDomain}`, '');
            } else if (parts.length > 2 || (parts.length === 2 && parts[0] !== 'localhost' && parts[1].includes('localhost'))) {
                // Fallback for general localhost/other domain testing
                subdomain = parts[0];
            }

            if (subdomain && subdomain !== 'www') {
                try {
                    // We use the full API_URL base URL logic in apiClient
                    const { default: apiClient } = await import('@/lib/api');
                    const response = await apiClient.get(`/tenants/lookup/${subdomain}`);
                    if (response.data && response.data.name) {
                        setTenantName(response.data.name);
                    }
                } catch (error) {
                    console.error('Failed to resolve tenant subdomain:', error);
                    // Optionally set an error state here if strict routing is desired
                }
            }
        };

        fetchTenantContext();
    }, []);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const submitPasscode = async (code: string) => {
        if (isLoggingIn) return;
        setIsLoggingIn(true);
        setError('');

        try {
            const result = await login({ passcode: code });
            if (result.success && result.user) {
                let target = '/billing';
                if (result.user.role === 'Waiter') target = '/tables';
                if (result.user.role === 'SuperAdmin' || result.user.roleRel?.name === 'SuperAdmin') target = '/admin';
                router.push(target);
            } else {
                console.error("Login failed:", result.error);
                setError(result.error || 'Invalid Passcode');
                setPasscode('');
                setIsLoggingIn(false);
            }
        } catch (err) {
            console.error("Login error:", err);
            setError('Login failed');
            setIsLoggingIn(false);
        }
    };

    const handleNumClick = (num: string) => {
        if (passcode.length < 4) {
            const newPasscode = passcode + num;
            setPasscode(newPasscode);
            setError('');

            if (newPasscode.length === 4) {
                submitPasscode(newPasscode);
            }
        }
    };

    const handleBackspace = () => {
        setPasscode(prev => prev.slice(0, -1));
        setError('');
    };

    const handleLoginSubmit = async () => {
        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }
        if (isLoggingIn) return;

        setIsLoggingIn(true);
        setError('');

        try {
            const result = await login({ username, password });
            if (result.success && result.user) {
                let target = '/billing';
                if (result.user.role === 'Waiter') target = '/tables';
                if (result.user.role === 'SuperAdmin' || result.user.roleRel?.name === 'SuperAdmin') target = '/admin';
                router.push(target);
            } else {
                console.error("Login failed:", result.error);
                setError(result.error || 'Invalid credentials');
                setIsLoggingIn(false);
            }
        } catch (err) {
            console.error("Login error:", err);
            setError('Login failed');
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-background text-foreground font-sans overflow-hidden relative selection:bg-primary/30">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[url('/login-bg.png')] bg-cover bg-center opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/80" />

            {/* Animated Orbs/Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />

            <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
                <div className="w-full max-w-[420px] bg-surface/30 backdrop-blur-xl border border-surface-light rounded-[32px] p-8 md:p-10 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-500">

                    {/* Header */}
                    <div className="flex flex-col items-center gap-2 mb-2">
                        <div className="text-3xl font-bold font-serif italic tracking-tighter text-foreground mb-1">
                            {tenantName ? tenantName : 'Neqtra'}
                        </div>
                        <p className="text-muted text-sm text-center">
                            {tenantName ? `Welcome to ${tenantName}. Please sign in to continue.` : 'Welcome back. Please sign in to continue.'}
                        </p>
                    </div>

                    {/* Toggle */}
                    <div className="flex p-1 bg-background/50 rounded-[16px] border border-surface-light">
                        <button
                            onClick={() => setActiveTab('passcode')}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-[12px] transition-all duration-300 ${activeTab === 'passcode'
                                ? 'bg-surface text-foreground shadow-sm'
                                : 'text-muted hover:text-foreground hover:bg-surface/50'
                                }`}
                        >
                            Passcode
                        </button>
                        <button
                            onClick={() => setActiveTab('login')}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-[12px] transition-all duration-300 ${activeTab === 'login'
                                ? 'bg-surface text-foreground shadow-sm'
                                : 'text-muted hover:text-foreground hover:bg-surface/50'
                                }`}
                        >
                            Credentials
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-xl text-center font-medium animate-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    {/* Content */}
                    {activeTab === 'login' ? (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Username</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                    <input
                                        className="w-full pl-10 pr-4 py-3.5 bg-background/50 border border-surface-light rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm font-medium placeholder:text-muted/50 text-foreground"
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Password</label>
                                <div className="relative group">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="password"
                                        className="w-full pl-10 pr-4 py-3.5 bg-background/50 border border-surface-light rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm font-medium placeholder:text-muted/50 text-foreground"
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleLoginSubmit}
                                disabled={isLoggingIn}
                                className="mt-2 w-full bg-primary hover:bg-primary/90 text-primary-fg py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(105,215,189,0.2)] hover:shadow-[0_0_30px_rgba(105,215,189,0.4)]"
                            >
                                {isLoggingIn ? 'Signing in...' : 'Sign In'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
                            {/* Passcode Visualizer */}
                            <div className="flex gap-4 mb-2 justify-center w-full">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-4 h-4 rounded-full transition-all duration-300 border-2 ${i < passcode.length
                                            ? 'bg-primary border-primary scale-110 shadow-[0_0_10px_rgba(105,215,189,0.5)]'
                                            : 'bg-transparent border-surface-light'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Keypad */}
                            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => handleNumClick(n.toString())}
                                        className="w-full aspect-square rounded-[20px] bg-background/50 hover:bg-surface border border-surface-light hover:border-primary/30 flex items-center justify-center text-2xl font-medium transition-all duration-200 active:scale-90 text-foreground"
                                    >
                                        {n}
                                    </button>
                                ))}
                                <div />
                                <button
                                    onClick={() => handleNumClick('0')}
                                    className="w-full aspect-square rounded-[20px] bg-background/50 hover:bg-surface border border-surface-light hover:border-primary/30 flex items-center justify-center text-2xl font-medium transition-all duration-200 active:scale-90 text-foreground"
                                >
                                    0
                                </button>
                                <button
                                    onClick={handleBackspace}
                                    className="w-full aspect-square rounded-[20px] hover:bg-destructive/10 text-muted hover:text-destructive border border-transparent hover:border-destructive/30 flex items-center justify-center transition-all duration-200 active:scale-90"
                                >
                                    <Delete className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
