import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';
import { TenantsService } from '../../tenants/tenants.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    constructor(
        private readonly cls: ClsService,
        private readonly tenantsService: TenantsService,
    ) { }

    async use(req: Request, res: Response, next: NextFunction) {
        // 1. Check for explicit header passed by Next.js proxy
        let tenantSlug = req.headers['x-tenant-slug'] as string;

        // 2. Fallback to extracting from Origin or Host if headers not strictly provided
        if (!tenantSlug) {
            const origin = req.headers.origin || '';
            const host = req.headers.host || '';
            const url = origin ? new URL(origin).hostname : host.split(':')[0];

            const baseDomain = process.env.BASE_DOMAIN || 'neqtra.com';

            if (url.endsWith(baseDomain) && url !== baseDomain) {
                tenantSlug = url.replace(`.${baseDomain}`, '');
            } else if (url.includes('localhost') || url.split('.').length > 2) {
                const parts = url.split('.');
                if (parts.length > 2 || (parts.length === 2 && parts[1] === 'localhost')) {
                    tenantSlug = parts[0];
                }
            }
        }

        const isSubdomain = tenantSlug && tenantSlug !== 'www' && tenantSlug !== 'localhost' && tenantSlug !== 'neqtra' && tenantSlug !== 'app';

        let tenantId = req.headers['x-tenant-id'] as string;

        // 3. Subdomain lookup
        if (!tenantId && isSubdomain) {
            const tenant = await this.tenantsService.findBySubdomain(tenantSlug);
            if (tenant) {
                tenantId = tenant.id;
            }
        }

        // 4. Fallback to JWT if still missing
        let isSystemUser = false;
        if (!tenantId && req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                if (token) {
                    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                    if (payload.tenantId) {
                        tenantId = payload.tenantId;
                    } else {
                        isSystemUser = true;
                    }
                }
            } catch (e) { }
        }

        // 5. Development Fallback: If still missing and on localhost, default to the first active tenant
        const isControlPlane = req.url.startsWith('/auth') || req.url.startsWith('/admin') || req.url.startsWith('/tenants');
        
        if (!tenantId && !isSystemUser && !isControlPlane && (req.headers.host?.includes('localhost') || !process.env.NODE_ENV || process.env.NODE_ENV === 'development')) {
            try {
                const tenants = await this.tenantsService.findAll();
                if (tenants.length > 0) {
                    tenantId = tenants[0].id;
                    console.log(`[TenantMiddleware] Defaulting to latest tenant for localhost: ${tenants[0].name} (${tenantId})`);
                }
            } catch (e) {
                // Ignore errors during fallback lookup
            }
        }

        if (tenantId) {
            this.cls.set('tenantId', tenantId);
            console.log(`[TenantMiddleware] Resolved Tenant ID for ${req.url}: ${tenantId}`);
        } else {
            console.log(`[TenantMiddleware] No Tenant ID resolved for ${req.url}`);
        }

        next();
    }
}
