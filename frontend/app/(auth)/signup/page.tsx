"use client";

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Store, MapPin, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SignupPage() {
    const router = useRouter();
    const { signup } = useAuthStore();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        businessName: '',
        businessType: 'Restaurant',
        currency: 'USD',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.name || !formData.email || !formData.password) {
                setError('Please fill in all fields');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
            }
        }
        if (step === 2) {
            if (!formData.businessName) {
                setError('Please enter your business name');
                return;
            }
        }
        setError('');
        setStep(step + 1);
    };

    const prevStep = () => {
        setError('');
        setStep(step - 1);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await signup({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                businessName: formData.businessName,
                businessType: formData.businessType
            });

            if (result.success) {
                // Redirect to the newly provisioned tenant subdomain
                if (result.login_url && window.location.hostname !== 'localhost') {
                    window.location.href = result.login_url;
                } else {
                    router.push('/billing');
                }
            } else {
                setError(result.error || 'Signup failed');
                setIsLoading(false);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[url('/login-bg.png')] bg-cover bg-center opacity-10 pointer-events-none" />
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md bg-surface/30 backdrop-blur-xl border border-surface-light rounded-3xl p-8 shadow-2xl relative z-10">

                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-4">
                        <span className="font-serif italic font-bold text-2xl tracking-tight text-foreground">
                            Neqtra
                        </span>
                    </Link>
                    <h2 className="text-2xl font-bold mb-2">Create your account</h2>
                    <p className="text-muted text-sm">Start your 14-day free trial today.</p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-between mb-8 px-4 relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-light -z-10" />
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2",
                            step >= s
                                ? "bg-primary border-primary text-primary-fg"
                                : "bg-background border-surface-light text-muted"
                        )}>
                            {s}
                        </div>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-xl mb-6 text-center">
                        {error}
                    </div>
                )}

                {/* Form Steps */}
                <div className="min-h-[300px]">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted">Full Name</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className="w-full bg-background/50 border border-surface-light rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted">Email Address</label>
                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        className="w-full bg-background/50 border border-surface-light rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted">Password</label>
                                    <input
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full bg-background/50 border border-surface-light rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted">Confirm Password</label>
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full bg-background/50 border border-surface-light rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                            </motion.div>
                        )}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="text-center mb-6">
                                    <Store className="w-12 h-12 text-primary mx-auto mb-2 opacity-80" />
                                    <h3 className="text-lg font-bold">Tell us about your business</h3>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted">Business Name</label>
                                    <input
                                        name="businessName"
                                        value={formData.businessName}
                                        onChange={handleChange}
                                        placeholder="Joe's Coffee"
                                        className="w-full bg-background/50 border border-surface-light rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted">Business Type</label>
                                    <select
                                        name="businessType"
                                        value={formData.businessType}
                                        onChange={handleChange}
                                        className="w-full bg-background/50 border border-surface-light rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors appearance-none"
                                    >
                                        <option value="Restaurant">Restaurant</option>
                                        <option value="Cafe">Cafe</option>
                                        <option value="Retail">Retail Store</option>
                                        <option value="FoodTruck">Food Truck</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </motion.div>
                        )}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 text-center"
                            >
                                <div className="bg-surface/50 p-6 rounded-2xl border border-surface-light">
                                    <h3 className="font-bold text-xl mb-2">You're all set!</h3>
                                    <p className="text-muted text-sm mb-4">
                                        We'll create your account, set up your first branch, and start your 14-day trial.
                                    </p>
                                    <div className="text-left text-sm space-y-2 bg-background/50 p-4 rounded-xl">
                                        <div className="flex justify-between">
                                            <span className="text-muted">Name:</span>
                                            <span className="font-bold">{formData.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted">Business:</span>
                                            <span className="font-bold">{formData.businessName} ({formData.businessType})</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted">Plan:</span>
                                            <span className="font-bold text-primary">14-Day Free Trial</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="mt-8 flex gap-4">
                    {step > 1 && (
                        <button
                            onClick={prevStep}
                            className="flex-1 py-3 rounded-xl font-bold border border-surface-light hover:bg-surface text-foreground transition-colors"
                        >
                            Back
                        </button>
                    )}
                    {step < 3 ? (
                        <button
                            onClick={nextStep}
                            className="flex-1 py-3 rounded-xl font-bold bg-primary text-primary-fg hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="flex-1 py-3 rounded-xl font-bold bg-primary text-primary-fg hover:opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                        </button>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-muted">
                        Already have an account? <Link href="/login" className="text-primary hover:underline font-bold">Log in</Link>
                    </p>
                </div>

            </div>
        </div>
    );
}
