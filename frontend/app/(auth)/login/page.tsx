"use client";

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, KeyRound, ChevronRight, Delete, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubdomain } from '@/hooks/useSubdomain';

const NUM_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function LoginPage() {
    const router = useRouter();
    const { login, user, hasHydrated } = useAuthStore();
    const { tenantInfo } = useSubdomain();

    const [tab, setTab] = useState<'passcode' | 'credentials'>('passcode');
    const [passcode, setPasscode] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [tenantName, setTenantName] = useState<string | null>(null);

    // Auto-redirect if already logged in
    useEffect(() => {
        if (hasHydrated && user) {
            const target = user.role === 'Waiter' ? '/tables'
                : (user.role === 'SuperAdmin' || user.roleRel?.name === 'SuperAdmin') ? '/admin'
                    : '/billing';
            router.replace(target);
        }
    }, [user, hasHydrated, router]);

    // Use tenant info from hook
    useEffect(() => {
        if (tenantInfo?.name) {
            setTenantName(tenantInfo.name);
        }
    }, [tenantInfo]);

    const redirectAfterLogin = (u: any) => {
        const target = u.role === 'Waiter' ? '/tables'
            : (u.role === 'SuperAdmin' || u.roleRel?.name === 'SuperAdmin') ? '/admin'
                : '/billing';
        router.push(target);
    };

    // Passcode logic
    const handleNumClick = (n: string) => {
        if (loading) return;
        if (passcode.length < 4) {
            const next = passcode + n;
            setPasscode(next);
            setError('');
            if (next.length === 4) submitPasscode(next);
        }
    };

    const submitPasscode = async (code: string) => {
        setLoading(true);
        const result = await login({ passcode: code });
        if (result.success && result.user) {
            redirectAfterLogin(result.user);
        } else {
            setError(result.error || 'Invalid passcode');
            setPasscode('');
            setLoading(false);
        }
    };

    // Credentials login
    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) { setError('Please fill in all fields'); return; }
        setLoading(true);
        setError('');
        const result = await login({ username, password });
        if (result.success && result.user) {
            redirectAfterLogin(result.user);
        } else {
            setError(result.error || 'Invalid credentials');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0D1212] flex overflow-hidden relative">
            {/* Left decorative panel */}
            <div className="hidden lg:flex flex-col justify-between w-[46%] bg-[#0A0F0F] border-r border-white/5 p-12 relative overflow-hidden">
                {/* Ambient glows */}
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#69D7BD]/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />

                {/* Logo */}
                <Link href="/" className="relative z-10">
                    <span className="font-serif italic font-bold text-3xl tracking-tighter text-white">Neqtra</span>
                    <span className="ml-2 text-xs font-bold text-primary uppercase tracking-widest">POS</span>
                </Link>

                {/* Feature testimonial */}
                <div className="relative z-10 space-y-8">
                    <div className="space-y-6">
                        {[
                            { icon: "⚡", title: "Lightning-Fast Billing", desc: "Process any order in under 3 seconds from table to receipt." },
                            { icon: "🏪", title: "Multi-Branch Control", desc: "Manage all your outlets from one powerful dashboard." },
                            { icon: "📊", title: "Real-Time Analytics", desc: "Revenue, inventory, and trends updated live across branches." },
                        ].map(f => (
                            <div key={f.title} className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0">
                                    {f.icon}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">{f.title}</div>
                                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <blockquote className="border-l-2 border-primary pl-4">
                        <p className="text-gray-400 text-sm italic leading-relaxed">
                            "Neqtra cut our checkout time by 60% and our inventory waste by a third. It's the POS system we always needed."
                        </p>
                        <div className="mt-3 text-xs font-bold text-gray-500">— Ravi K., Owner, Brew & Bites</div>
                    </blockquote>
                </div>

                <div className="text-xs text-gray-600 relative z-10">
                    © 2026 Neqtra POS · <Link href="/signup" className="hover:text-gray-400 transition-colors">Create an account</Link>
                </div>
            </div>

            {/* Right: Form Panel */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />

                <div className="w-full max-w-[400px] relative z-10">
                    {/* Mobile logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <span className="font-serif italic font-bold text-3xl tracking-tighter text-white">Neqtra</span>
                        <span className="ml-2 text-xs font-bold text-primary uppercase tracking-widest">POS</span>
                    </div>

                    {/* Tenant greeting */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            {tenantName ? `Welcome to ${tenantName}` : 'Welcome back'}
                        </h1>
                        <p className="text-gray-500 text-sm mt-2">Sign in to continue to your dashboard.</p>
                    </div>

                    {/* Tab toggle */}
                    <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 mb-6">
                        {(['passcode', 'credentials'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => { setTab(t); setError(''); setPasscode(''); }}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 capitalize ${tab === t ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {t === 'passcode' ? 'Passcode' : 'Credentials'}
                            </button>
                        ))}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    {/* ─── Passcode Tab ─── */}
                    {tab === 'passcode' && (
                        <div className="flex flex-col items-center gap-6">
                            {/* Dots */}
                            <div className="flex gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${i < passcode.length ? 'bg-primary border-primary scale-125 shadow-[0_0_12px_rgba(105,215,189,0.6)]' : 'bg-transparent border-white/20'}`} />
                                ))}
                            </div>

                            {loading && <div className="text-primary text-sm animate-pulse font-semibold">Verifying...</div>}

                            {/* Keypad */}
                            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                                {NUM_KEYS.map(n => (
                                    <button
                                        key={n}
                                        onClick={() => handleNumClick(n.toString())}
                                        disabled={loading}
                                        className="aspect-square rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 text-white text-2xl font-semibold transition-all active:scale-90 disabled:opacity-50"
                                    >
                                        {n}
                                    </button>
                                ))}
                                <div />
                                <button
                                    onClick={() => handleNumClick('0')}
                                    disabled={loading}
                                    className="aspect-square rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 text-white text-2xl font-semibold transition-all active:scale-90 disabled:opacity-50"
                                >
                                    0
                                </button>
                                <button
                                    onClick={() => { setPasscode(p => p.slice(0, -1)); setError(''); }}
                                    className="aspect-square rounded-2xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 border border-transparent hover:border-red-500/20 flex items-center justify-center transition-all active:scale-90"
                                >
                                    <Delete className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ─── Credentials Tab ─── */}
                    {tab === 'credentials' && (
                        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Username</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={e => { setUsername(e.target.value); setError(''); }}
                                        placeholder="Enter your username"
                                        className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm text-white placeholder:text-gray-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Password</label>
                                <div className="relative group">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => { setPassword(e.target.value); setError(''); }}
                                        placeholder="Enter your password"
                                        className="w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm text-white placeholder:text-gray-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(s => !s)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 bg-primary hover:bg-primary/90 text-[#0D1212] py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(105,215,189,0.2)] hover:shadow-[0_0_30px_rgba(105,215,189,0.35)] active:scale-[0.98]"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />Signing in...</span>
                                ) : (
                                    <span className="flex items-center gap-2">Sign In <ArrowRight className="w-4 h-4" /></span>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Footer links */}
                    <div className="mt-8 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-primary font-semibold hover:underline underline-offset-4">
                            Start free trial
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
