"use client";

import React, { useState, useEffect } from 'react';
import { User, KeyRound, CreditCard, Delete, Divide } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
    const [passcode, setPasscode] = useState('');
    const [activeTab, setActiveTab] = useState<'login' | 'passcode'>('passcode');
    const router = useRouter();

    const { login, user, hasHydrated } = useAuthStore();
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        if (hasHydrated && user) {
            const target = user.role === 'Waiter' ? '/tables' : '/billing';
            router.replace(target);
        }
    }, [user, hasHydrated, router]);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const submitPasscode = async (code: string) => {
        if (isLoggingIn) return;
        setIsLoggingIn(true);
        setError('');

        try {
            const result = await login({ passcode: code });
            if (result.success && result.user) {
                if (result.user.role === 'Waiter') {
                    router.push('/tables');
                } else {
                    router.push('/billing');
                }
            } else {
                setError(result.error || 'Invalid Passcode');
                setPasscode('');
                setIsLoggingIn(false);
            }
        } catch (err) {
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

    const handleEnter = async () => {
        if (passcode.length < 4) return;
        submitPasscode(passcode);
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
                if (result.user.role === 'Waiter') {
                    router.push('/tables');
                } else {
                    router.push('/billing');
                }
            } else {
                setError(result.error || 'Invalid credentials');
                setIsLoggingIn(false);
            }
        } catch (err) {
            setError('Login failed');
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            {/* Header */}
            <header className="bg-surface border-b border-border px-8 py-3 flex justify-between items-center">
                <div className="text-2xl font-bold italic font-serif">
                    Neqtra
                </div>
                <div className="text-right text-sm text-muted">
                    <div className="font-semibold text-foreground">Neqtra POS</div>
                    <div className="opacity-80 text-xs">REF No. : 112011</div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">



                {/* Center Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center pt-10 px-8 relative bg-background">

                    {/* Top Navigation Tabs */}
                    <div className="flex items-center gap-4 mb-8 bg-surface p-1 rounded-lg border border-border">
                        <button
                            onClick={() => setActiveTab('passcode')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all ${activeTab === 'passcode'
                                ? 'bg-primary text-primary-fg shadow-sm'
                                : 'text-muted hover:text-foreground'
                                }`}
                        >
                            <KeyRound size={18} />
                            <span className="font-medium">Passcode</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('login')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all ${activeTab === 'login'
                                ? 'bg-primary text-primary-fg shadow-sm'
                                : 'text-muted hover:text-foreground'
                                }`}
                        >
                            <User size={18} />
                            <span className="font-medium">Login</span>
                        </button>
                    </div>

                    {activeTab === 'passcode' && (
                        <>
                            <h2 className="text-xl font-semibold mb-8 text-foreground">
                                Enter the Passcode to access
                            </h2>
                            {error && <p className="text-destructive mb-4">{error}</p>}

                            {/* PIN Dots */}
                            <div className="flex gap-6 mb-12 bg-surface p-4 w-full max-w-md justify-center rounded-lg border border-border">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-4 h-4 rounded-full border border-muted ${i < passcode.length ? 'bg-primary border-primary' : 'bg-transparent'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Keypad Grid */}
                            <div className="grid grid-cols-3 gap-x-12 gap-y-8 mb-8">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handleNumClick(num.toString())}
                                        className="w-16 h-16 rounded-full border border-border text-foreground text-2xl font-light hover:bg-surface flex items-center justify-center transition-colors"
                                    >
                                        {num}
                                    </button>
                                ))}

                                {/* Bottom Row */}
                                <button
                                    onClick={handleBackspace}
                                    className="w-16 h-16 rounded bg-surface-light text-foreground flex items-center justify-center hover:bg-surface border border-border transition-colors"
                                >
                                    <Delete size={24} />
                                </button>

                                <button
                                    onClick={() => handleNumClick('0')}
                                    className="w-16 h-16 rounded-full border border-border text-foreground text-2xl font-light hover:bg-surface flex items-center justify-center transition-colors"
                                >
                                    0
                                </button>

                                <button
                                    onClick={handleEnter}
                                    className="w-16 h-16 rounded bg-primary text-primary-fg flex items-center justify-center hover:opacity-90 transition-colors transform rotate-180"
                                >
                                    {/* Enter Icon */}
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 10 4 15 9 20"></polyline>
                                        <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
                                    </svg>
                                </button>
                            </div>
                        </>
                    )}

                    {activeTab === 'login' && (
                        <div className="w-full max-w-sm flex flex-col gap-4">
                            <h2 className="text-xl font-semibold text-foreground mb-4 text-center">
                                Staff Login
                            </h2>
                            {error && <p className="text-destructive text-sm">{error}</p>}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full p-3 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                    placeholder="Enter username"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                    placeholder="Enter password"
                                />
                            </div>
                            <button
                                onClick={handleLoginSubmit}
                                className="w-full bg-primary text-primary-fg p-3 rounded-lg font-medium hover:opacity-90 transition-colors mt-4"
                            >
                                Login
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-border py-3 px-8 flex justify-between text-xs text-muted bg-surface">
                <div className="flex gap-4">
                    <span>Need Quick Help? <span className="text-foreground font-semibold">📞 07969 223344</span></span>
                </div>
                <div className="flex gap-4">
                    <span>Contact for Support <span className="text-foreground font-semibold">✉ support@neqtra.com</span></span>
                </div>
                <div className="flex gap-4">
                    <span className="opacity-50">Version : 107.0.1</span>
                </div>
            </footer>
        </div>
    );
}
