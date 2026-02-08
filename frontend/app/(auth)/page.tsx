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
        <div className="flex h-screen bg-white text-black font-sans overflow-hidden">
            {/* Left Side - Login Form */}
            <div className="w-full lg:w-[45%] flex flex-col p-4 md:p-12 relative h-full justify-center">

                <div className="max-w-[360px] w-full mx-auto flex flex-col justify-center flex-1 py-4">
                    {/* Logo Mark */}
                    <div className="mb-4 flex justify-center lg:justify-start">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                                <span className="font-serif italic font-bold text-lg">N</span>
                            </div>
                            <span className="text-2xl font-bold font-serif italic tracking-tight">Neqtra</span>
                        </div>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight text-gray-900 text-center lg:text-left">Sign in to your account</h1>
                    <p className="text-gray-500 mb-6 text-sm leading-relaxed text-center lg:text-left">Please continue to sign in to your business account to access the dashboard.</p>

                    {/* Toggle Switch */}
                    <div className="flex p-1 bg-gray-100 rounded-xl mb-6 border border-gray-200">
                        <button
                            onClick={() => setActiveTab('passcode')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'passcode'
                                ? 'bg-white text-black shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-black'
                                }`}
                        >
                            Passcode
                        </button>
                        <button
                            onClick={() => setActiveTab('login')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'login'
                                ? 'bg-white text-black shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-black'
                                }`}
                        >
                            Credentials
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6 text-center font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    {activeTab === 'login' ? (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Username or Email</label>
                                <input
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm font-medium placeholder:text-gray-400"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Password</label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm font-medium placeholder:text-gray-400"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleLoginSubmit}
                                disabled={isLoggingIn}
                                className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-black/20"
                            >
                                {isLoggingIn ? 'Signing in...' : 'Continue'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
                            {/* Passcode Visualizer */}
                            <div className="flex gap-4 mb-6 justify-center w-full">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-4 h-4 rounded-full transition-all duration-300 border-2 ${i < passcode.length
                                            ? 'bg-black border-black scale-110 shadow-md'
                                            : 'bg-transparent border-gray-300'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Keypad */}
                            <div className="grid grid-cols-3 gap-4 w-full max-w-[280px] mx-auto">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => handleNumClick(n.toString())}
                                        className="w-full aspect-square rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200 flex items-center justify-center text-2xl font-medium transition-all duration-200 active:scale-95 text-gray-900"
                                    >
                                        {n}
                                    </button>
                                ))}
                                <div />
                                <button
                                    onClick={() => handleNumClick('0')}
                                    className="w-full aspect-square rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200 flex items-center justify-center text-2xl font-medium transition-all duration-200 active:scale-95 text-gray-900"
                                >
                                    0
                                </button>
                                <button
                                    onClick={handleBackspace}
                                    className="w-full aspect-square rounded-2xl hover:bg-red-50 text-gray-400 hover:text-red-500 border border-transparent hover:border-red-100 flex items-center justify-center transition-all duration-200 active:scale-95"
                                >
                                    <Delete className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    )}


                </div>
            </div>

            {/* Right Side - Image/Pattern */}
            <div className="hidden lg:block flex-1 bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-screen grayscale contrast-125"></div>

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />

                {/* Floating Elements (Decorative) */}
                <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 backdrop-blur-3xl rounded-full blur-2xl"></div>
                <div className="absolute bottom-40 left-20 w-64 h-64 bg-white/5 backdrop-blur-3xl rounded-full blur-3xl"></div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-16 text-white text-left z-10">
                    <div className="max-w-xl">
                        <div className="w-16 h-1 bg-white mb-8"></div>
                        <blockquote className="text-3xl font-medium leading-tight mb-6 tracking-tight">
                            "Neqtra transformed how we manage our rush hours. It's not just a POS, it's the heart of our cafe."
                        </blockquote>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-lg font-bold backdrop-blur-md">
                                SJ
                            </div>
                            <div>
                                <div className="font-bold text-lg">Sarah Jenkins</div>
                                <div className="text-white/60 text-sm font-medium">Owner, The Daily Grind</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
