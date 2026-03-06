"use client";

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Eye, EyeOff, User, Mail, Lock, Building2, ChevronRight,
    ArrowRight, Check, Loader2, Store, UtensilsCrossed, ShoppingBag, Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
    { label: 'Your Details', desc: 'Create your account credentials' },
    { label: 'Your Business', desc: 'Tell us about your business' },
    { label: 'Confirm', desc: 'Review and launch' },
];

const BUSINESS_TYPES = [
    { value: 'Restaurant', label: 'Restaurant', icon: UtensilsCrossed, color: 'from-orange-500/20 to-amber-500/10 border-orange-500/30' },
    { value: 'Cafe', label: 'Café / Coffee Shop', icon: Store, color: 'from-brown-500/20 to-amber-600/10 border-amber-600/30' },
    { value: 'Retail', label: 'Retail Store', icon: ShoppingBag, color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30' },
    { value: 'FoodTruck', label: 'Food Truck', icon: Truck, color: 'from-green-500/20 to-emerald-500/10 border-green-500/30' },
];

function PasswordStrength({ password }: { password: string }) {
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    const strength = checks.filter(Boolean).length;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', 'bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-primary'];
    if (!password) return null;
    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300', i <= strength ? colors[strength] : 'bg-white/10')} />
                ))}
            </div>
            <div className="flex justify-between">
                <p className="text-[10px] text-gray-500">
                    {checks[0] ? '✓ 8+ chars' : '✗ 8+ chars'} · {checks[1] ? '✓ uppercase' : '✗ uppercase'} · {checks[2] ? '✓ number' : '✗ number'}
                </p>
                <p className={cn('text-[10px] font-bold', strength >= 3 ? 'text-primary' : 'text-gray-500')}>{labels[strength]}</p>
            </div>
        </div>
    );
}

function InputField({ label, icon: Icon, error, ...props }: any) {
    const [show, setShow] = useState(false);
    const isPassword = props.type === 'password';
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{label}</label>
            <div className="relative group">
                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input
                    {...props}
                    type={isPassword ? (show ? 'text' : 'password') : props.type}
                    className={cn(
                        'w-full pl-11 py-3.5 bg-white/5 border rounded-xl focus:outline-none focus:ring-1 transition-all text-sm text-white placeholder:text-gray-600',
                        error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-primary/50 focus:ring-primary/20',
                        isPassword ? 'pr-12' : 'pr-4'
                    )}
                />
                {isPassword && (
                    <button type="button" onClick={() => setShow(s => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
            {error && <p className="text-xs text-red-400 ml-1">{error}</p>}
        </div>
    );
}

export default function SignupPage() {
    const router = useRouter();
    const { signup } = useAuthStore();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        businessName: '',
        businessType: 'Restaurant',
    });

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [k]: e.target.value }));
        setFieldErrors(fe => ({ ...fe, [k]: '' }));
        setGlobalError('');
    };

    const validateStep1 = () => {
        const errs: Record<string, string> = {};
        if (!form.name.trim()) errs.name = 'Name is required';
        if (!form.email.trim()) errs.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
        if (!form.password) errs.password = 'Password is required';
        else if (form.password.length < 8) errs.password = 'Minimum 8 characters';
        if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep2 = () => {
        const errs: Record<string, string> = {};
        if (!form.businessName.trim()) errs.businessName = 'Business name is required';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const nextStep = () => {
        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateStep2()) return;
        setStep(s => s + 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setGlobalError('');
        try {
            const result = await signup({
                name: form.name,
                email: form.email,
                password: form.password,
                businessName: form.businessName,
                businessType: form.businessType,
            });
            if (result.success) {
                if (result.login_url && window.location.hostname !== 'localhost') {
                    window.location.href = result.login_url;
                } else {
                    router.push('/billing');
                }
            } else {
                setGlobalError(result.error || 'Signup failed. Please try again.');
                setLoading(false);
            }
        } catch (err: any) {
            setGlobalError(err.message || 'An unexpected error occurred.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0D1212] flex overflow-hidden relative">
            {/* Background glows */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Left branding panel */}
            <div className="hidden lg:flex flex-col justify-between w-[42%] bg-[#0A0F0F] border-r border-white/5 p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5" />

                <Link href="/" className="relative z-10">
                    <span className="font-serif italic font-bold text-3xl tracking-tighter text-white">Neqtra</span>
                    <span className="ml-2 text-xs font-bold text-primary uppercase tracking-widest">POS</span>
                </Link>

                <div className="relative z-10 space-y-8">
                    <div>
                        <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
                            Start selling smarter,<br />
                            <span className="text-primary">starting today.</span>
                        </h2>
                        <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                            Join thousands of restaurants, cafés, and retailers running their operations on Neqtra POS.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {[
                            '14-day free trial, no credit card required',
                            'Setup in under 5 minutes',
                            'Unlimited orders on all plans',
                            'Free onboarding support',
                        ].map(item => (
                            <div key={item} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 text-primary" />
                                </div>
                                <span className="text-sm text-gray-400">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-xs text-gray-600 relative z-10">
                    Already have an account?{' '}
                    <Link href="/login" className="text-gray-400 hover:text-white transition-colors">Sign in</Link>
                </div>
            </div>

            {/* Right: Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-[440px]">
                    {/* Mobile logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <span className="font-serif italic font-bold text-3xl tracking-tighter text-white">Neqtra</span>
                        <span className="ml-2 text-xs font-bold text-primary uppercase tracking-widest">POS</span>
                    </div>

                    {/* Step indicator */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            {STEPS.map((s, i) => {
                                const n = i + 1;
                                const done = step > n;
                                const active = step === n;
                                return (
                                    <React.Fragment key={n}>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className={cn(
                                                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2',
                                                done ? 'bg-primary border-primary text-[#0D1212]'
                                                    : active ? 'bg-transparent border-primary text-primary'
                                                        : 'bg-transparent border-white/20 text-gray-600'
                                            )}>
                                                {done ? <Check className="w-4 h-4" /> : n}
                                            </div>
                                            <span className={cn('text-xs font-semibold hidden sm:block', active ? 'text-white' : 'text-gray-600')}>
                                                {s.label}
                                            </span>
                                        </div>
                                        {i < STEPS.length - 1 && (
                                            <div className={cn('flex-1 h-px transition-colors', step > n ? 'bg-primary' : 'bg-white/10')} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                        <h1 className="text-2xl font-bold text-white">{STEPS[step - 1].label}</h1>
                        <p className="text-gray-500 text-sm mt-1">{STEPS[step - 1].desc}</p>
                    </div>

                    {/* Global error */}
                    {globalError && (
                        <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center">
                            {globalError}
                        </div>
                    )}

                    {/* ─── Step 1: Account ─── */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <InputField label="Full Name" icon={User} name="name" type="text" placeholder="John Doe"
                                value={form.name} onChange={set('name')} error={fieldErrors.name} />
                            <InputField label="Email Address" icon={Mail} name="email" type="email" placeholder="john@example.com"
                                value={form.email} onChange={set('email')} error={fieldErrors.email} />
                            <div>
                                <InputField label="Password" icon={Lock} name="password" type="password" placeholder="Create a password"
                                    value={form.password} onChange={set('password')} error={fieldErrors.password} />
                                <PasswordStrength password={form.password} />
                            </div>
                            <InputField label="Confirm Password" icon={Lock} name="confirmPassword" type="password" placeholder="Repeat your password"
                                value={form.confirmPassword} onChange={set('confirmPassword')} error={fieldErrors.confirmPassword} />
                        </div>
                    )}

                    {/* ─── Step 2: Business ─── */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <InputField label="Business Name" icon={Building2} name="businessName" type="text" placeholder="e.g. Brew & Bites"
                                value={form.businessName} onChange={set('businessName')} error={fieldErrors.businessName} />

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Business Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {BUSINESS_TYPES.map(bt => {
                                        const Icon = bt.icon;
                                        const selected = form.businessType === bt.value;
                                        return (
                                            <button
                                                key={bt.value}
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, businessType: bt.value }))}
                                                className={cn(
                                                    'flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left',
                                                    selected
                                                        ? 'bg-primary/10 border-primary/40 text-white'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
                                                )}
                                            >
                                                <Icon className={cn('w-5 h-5', selected ? 'text-primary' : 'text-gray-600')} />
                                                <span className="text-xs font-semibold leading-tight">{bt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Step 3: Confirm ─── */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                                {[
                                    { label: 'Name', value: form.name },
                                    { label: 'Email', value: form.email },
                                    { label: 'Business', value: form.businessName },
                                    { label: 'Type', value: form.businessType },
                                    { label: 'Plan', value: '14-Day Free Trial' },
                                ].map(row => (
                                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{row.label}</span>
                                        <span className={cn('text-sm font-semibold', row.label === 'Plan' ? 'text-primary' : 'text-white')}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-gray-400 leading-relaxed">
                                By creating an account you agree to our{' '}
                                <span className="text-primary font-semibold">Terms of Service</span> and{' '}
                                <span className="text-primary font-semibold">Privacy Policy</span>.
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 mt-8">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(s => s - 1)}
                                disabled={loading}
                                className="flex-1 py-3.5 rounded-xl font-bold border border-white/10 text-gray-400 hover:border-white/20 hover:text-white transition-all text-sm"
                            >
                                Back
                            </button>
                        )}
                        {step < 3 ? (
                            <button
                                onClick={nextStep}
                                className="flex-1 py-3.5 rounded-xl font-bold bg-primary hover:bg-primary/90 text-[#0D1212] transition-all text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                Continue <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 py-3.5 rounded-xl font-bold bg-primary hover:bg-primary/90 text-[#0D1212] transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] shadow-[0_0_20px_rgba(105,215,189,0.2)]"
                            >
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                                ) : (
                                    <>Launch My Account <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        )}
                    </div>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary font-semibold hover:underline underline-offset-4">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
