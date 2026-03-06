import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';

export function useSubdomain() {
    const [subdomain, setSubdomain] = useState<string | null>(null);
    const [tenantInfo, setTenantInfo] = useState<{ id: string; name: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const host = window.location.hostname;
        const base = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'pos.neqtra.com';

        let sub: string | null = null;

        // Handle production: tenant.pos.neqtra.com
        if (host.endsWith(base) && host !== base) {
            sub = host.replace(`.${base}`, '');
        }
        // Handle local/other: tenant.localhost
        else {
            const parts = host.split('.');
            if (parts.length > 2 || (parts.length === 2 && parts[1] === 'localhost')) {
                sub = parts[0];
            }
        }

        if (sub && sub !== 'www' && sub !== 'app') {
            setSubdomain(sub);
            apiClient.get(`/tenants/lookup/${sub}`)
                .then(r => {
                    if (r.data) setTenantInfo(r.data);
                })
                .catch(() => {
                    setTenantInfo(null);
                })
                .finally(() => setLoading(false));
        } else {
            setSubdomain(null);
            setTenantInfo(null);
            setLoading(false);
        }
    }, []);

    return { subdomain, tenantInfo, loading };
}
