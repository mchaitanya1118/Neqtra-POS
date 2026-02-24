'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { TenantService } from '@/services/tenant.service';
import { Store, Save, Loader2, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const currentUser = user as any;

    const [formData, setFormData] = useState({
        name: currentUser?.tenant?.name || '',
        email: currentUser?.tenant?.email || '',
        phone: currentUser?.tenant?.phone || '',
        currency: currentUser?.tenant?.currency || 'USD',
        taxRate: currentUser?.tenant?.taxRate || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const updatedTenant = await TenantService.updateProfile({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                currency: formData.currency,
                taxRate: Number(formData.taxRate),
            });

            // Update AuthStore with new tenant details so UI immediately reflects changes
            // Update AuthStore with new tenant details so UI immediately reflects changes
            useAuthStore.setState({
                user: {
                    ...currentUser,
                    tenant: { ...currentUser.tenant, ...updatedTenant }
                }
            });

            setSuccessMessage('Workspace settings updated successfully.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to update settings');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between bg-surface/50 p-6 rounded-2xl border border-surface-light">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Store className="text-primary" /> Workspace Settings
                    </h1>
                    <p className="text-muted text-sm mt-1">Manage your brand, contact info, and regional defaults.</p>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-sm p-4 rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> {successMessage}
                </div>
            )}

            <div className="bg-surface/50 border border-surface-light rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted">Business Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="My Cafe"
                            className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted">Business Email</label>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="admin@mycafe.com"
                            className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted">Phone Number</label>
                        <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+1 (555) 000-0000"
                            className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted">Base Currency</label>
                        <select
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors appearance-none"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="INR">INR (₹)</option>
                            <option value="CAD">CAD ($)</option>
                            <option value="AUD">AUD ($)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted">Default Tax Rate (%)</label>
                        <input
                            name="taxRate"
                            type="number"
                            step="0.01"
                            max="100"
                            min="0"
                            value={formData.taxRate}
                            onChange={handleChange}
                            className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-3 rounded-xl font-bold bg-primary text-primary-fg hover:opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isLoading ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}
