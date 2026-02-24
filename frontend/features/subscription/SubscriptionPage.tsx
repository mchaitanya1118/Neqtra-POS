'use client';

import { useState, useEffect } from 'react';
import { SubscriptionService } from '@/services/subscription.service';
import { CreditCard, CheckCircle, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

// In a real app these would come from env vars or backend
const PRICING_PLANS = [
    {
        name: 'STARTER',
        price: '$29',
        priceId: 'price_starter_placeholder',
        features: ['1 Branch', '3 Users', 'Basic Tracking', 'Email Support'],
        recommended: false
    },
    {
        name: 'PRO',
        price: '$79',
        priceId: 'price_pro_placeholder',
        features: ['Up to 3 Branches', '10 Users', 'Advanced Reports', 'Priority Support'],
        recommended: true
    },
    {
        name: 'ENTERPRISE',
        price: '$199',
        priceId: 'price_enterprise_placeholder',
        features: ['Unlimited Branches', 'Unlimited Users', 'Custom Access Roles', '24/7 Phone Support'],
        recommended: false
    }
];

export default function SubscriptionPage() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState<string | null>(null);
    const [quota, setQuota] = useState<any>(null);

    useEffect(() => {
        loadQuota();
    }, []);

    const loadQuota = async () => {
        try {
            const data = await SubscriptionService.getQuota();
            setQuota(data);
        } catch (err) {
            console.error('Failed to load quota:', err);
        }
    };

    const handleUpgrade = async (priceId: string) => {
        setLoading(priceId);
        try {
            const { url } = await SubscriptionService.createCheckoutSession(priceId);
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error('Failed to create checkout session:', error);
            alert('Could not start checkout process. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    const handleManageBilling = async () => {
        setLoading('portal');
        try {
            const { url } = await SubscriptionService.getPortalSession();
            if (url) {
                window.location.href = url;
            }
        } catch (error: any) {
            console.error('Failed to open billing portal:', error);
            alert(error?.response?.data?.message || 'Are you subscribed? Only paying customers can access the billing portal.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard className="text-indigo-600" /> Billing & Plans
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your SaaS subscription and billing details.</p>
                </div>
                <button
                    onClick={handleManageBilling}
                    disabled={loading === 'portal'}
                    className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    {loading === 'portal' ? 'Redirecting...' : 'Manage Billing Portal'}
                </button>
            </div>

            {quota && (
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <h2 className="text-lg font-bold text-gray-900">Current Plan Quotas ({quota.plan})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-gray-700">Active Branches</span>
                                <span className="font-bold text-gray-900">
                                    {quota.usage.branches.current} / {quota.usage.branches.max === null ? '∞' : quota.usage.branches.max}
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full ${quota.usage.branches.max && quota.usage.branches.current >= quota.usage.branches.max ? 'bg-red-500' : 'bg-indigo-600'}`}
                                    style={{ width: `${quota.usage.branches.max ? Math.min((quota.usage.branches.current / quota.usage.branches.max) * 100, 100) : 5}%` }}
                                ></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-gray-700">Active Devices</span>
                                <span className="font-bold text-gray-900">
                                    {quota.usage.devices.current} / {quota.usage.devices.max === null ? '∞' : quota.usage.devices.max}
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full ${quota.usage.devices.max && quota.usage.devices.current >= quota.usage.devices.max ? 'bg-red-500' : 'bg-indigo-600'}`}
                                    style={{ width: `${quota.usage.devices.max ? Math.min((quota.usage.devices.current / quota.usage.devices.max) * 100, 100) : 5}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                {PRICING_PLANS.map((plan) => (
                    <div
                        key={plan.name}
                        className={`relative bg-white rounded-2xl border flex flex-col ${plan.recommended ? 'border-indigo-500 shadow-lg scale-105' : 'border-gray-200 shadow-sm'}`}
                    >
                        {plan.recommended && (
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                <Zap size={14} /> Most Popular
                            </div>
                        )}

                        <div className="p-8 flex-grow">
                            <h3 className="text-xl font-bold text-gray-900 text-center">{plan.name}</h3>
                            <div className="mt-4 flex justify-center items-baseline text-5xl font-extrabold text-gray-900">
                                {plan.price}
                                <span className="text-xl font-medium text-gray-500 ml-1">/mo</span>
                            </div>

                            <ul className="mt-8 space-y-4">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-3">
                                        <CheckCircle className="text-green-500" size={20} />
                                        <span className="text-gray-600">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-8 pt-0 mt-auto">
                            <button
                                onClick={() => handleUpgrade(plan.priceId)}
                                disabled={loading !== null}
                                className={`w-full py-3 px-4 rounded-xl font-bold transition-all ${plan.recommended
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                    } disabled:opacity-50`}
                            >
                                {loading === plan.priceId ? 'Processing...' : `Upgrade to ${plan.name}`}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
