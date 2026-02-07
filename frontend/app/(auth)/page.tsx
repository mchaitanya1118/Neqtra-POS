"use client";

import React, { useState } from 'react';
import { User, KeyRound, CreditCard, Delete, Divide, Monitor } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
    const [passcode, setPasscode] = useState('');
    const [activeTab, setActiveTab] = useState<'login' | 'passcode' | 'swipe'>('passcode');
    const router = useRouter();

    const { login } = useAuthStore();
    const [error, setError] = useState('');

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleNumClick = (num: string) => {
        if (passcode.length < 4) {
            setPasscode(prev => prev + num);
            setError(''); // Clear error on input
        }
    };

    const handleBackspace = () => {
        setPasscode(prev => prev.slice(0, -1));
        setError('');
    };

    const handleEnter = async () => {
        if (passcode.length < 4) return;

        const result = await login({ passcode });
        if (result.success && result.user) {
            if (result.user.role === 'Waiter') {
                router.push('/tables');
            } else {
                router.push('/billing');
            }
        } else {
            setError(result.error || 'Invalid Passcode');
            setPasscode('');
        }
    };

    const handleLoginSubmit = async () => {
        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }

        const result = await login({ username, password });
        if (result.success && result.user) {
            if (result.user.role === 'Waiter') {
                router.push('/tables');
            } else {
                router.push('/billing');
            }
        } else {
            setError(result.error || 'Invalid credentials');
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

                {/* Left Side - Illustration */}
                <div className="flex-[0.8] flex items-center justify-center bg-surface border-r border-border">
                    <div className="opacity-20 flex flex-col items-center">
                        <Monitor size={200} strokeWidth={1} />
                        <div className="mt-4 border-2 border-current rounded-lg p-2 w-32 h-10 flex justify-center items-center">
                            <div className="bg-current rounded-full w-full h-1"></div>
                        </div>
                    </div>
                </div>

                {/* Center Content Area */}
                <div className="flex-[1.4] flex flex-col items-center justify-center pt-10 px-8 relative bg-background">
                    {activeTab === 'passcode' && (
                        <>
                            <h2 className="text-xl font-semibold mb-8 text-foreground">
                                Enter the Passcode to access this Billing Station
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

                    {activeTab === 'swipe' && (
                        <div className="flex flex-col items-center justify-center text-muted">
                            <CreditCard size={100} strokeWidth={1} className="mb-4" />
                            <p className="text-lg">Please swipe your access card</p>
                        </div>
                    )}
                </div>

                {/* Right Side - Actions */}
                <div className="w-48 bg-surface border-l border-border flex flex-col justify-center">

                    <button
                        onClick={() => setActiveTab('login')}
                        className={`h-32 flex flex-col items-center justify-center gap-2 text-muted hover:bg-surface-light transition-colors relative ${activeTab === 'login' ? 'text-foreground' : ''}`}
                    >
                        <User size={32} />
                        <span className="font-medium">Login</span>
                        {activeTab === 'login' && <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary"></div>}
                    </button>

                    <button
                        onClick={() => setActiveTab('passcode')}
                        className={`h-32 flex flex-col items-center justify-center gap-2 text-muted hover:bg-surface-light transition-colors relative ${activeTab === 'passcode' ? 'text-foreground' : ''}`}
                    >
                        {/* Custom Passcode Icon */}
                        <div className="flex flex-col items-center">
                            <div className="flex gap-0.5 mb-1">
                                <div className="w-1 h-1 bg-current rounded-full"></div>
                                <div className="w-1 h-1 bg-current rounded-full"></div>
                                <div className="w-1 h-1 bg-current rounded-full"></div>
                            </div>
                            <KeyRound size={32} />
                        </div>
                        <span className="font-medium">Passcode</span>
                        {activeTab === 'passcode' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary"></div>}
                    </button>

                    <button
                        onClick={() => setActiveTab('swipe')}
                        className={`h-32 flex flex-col items-center justify-center gap-2 text-muted hover:bg-surface-light transition-colors relative ${activeTab === 'swipe' ? 'text-foreground' : ''}`}
                    >
                        <CreditCard size={32} />
                        <span className="font-medium">Swipe Card</span>
                        {activeTab === 'swipe' && <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary"></div>}
                    </button>

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
