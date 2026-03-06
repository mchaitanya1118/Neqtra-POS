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
        const host = req.headers.host || '';
        const subdomain = host.split('.')[0];

        // 1. Check if it's a subdomain (not 'www' or the main domain)
        // For local dev, we might use something like 'restaurant1.localhost:3000'
        const isSubdomain = subdomain && subdomain !== 'www' && subdomain !== 'localhost' && subdomain !== 'neqtra';

        let tenantId = req.headers['x-tenant-id'] as string;

        // 2. Subdomain lookup (Requirement #3)
        if (!tenantId && isSubdomain) {
            const tenant = await this.tenantsService.findBySubdomain(subdomain);
            if (tenant) {
                tenantId = tenant.id;
            }
        }

        // 3. Fallback to JWT if still missing
        if (!tenantId && req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                if (token) {
                    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                    if (payload.tenantId) {
                        tenantId = payload.tenantId;
                    }
                }
            } catch (e) { }
        }

        if (tenantId) {
            this.cls.set('tenantId', tenantId);
        }

        next();
    }
}
