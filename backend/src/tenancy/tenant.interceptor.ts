import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
    constructor(
        private readonly cls: ClsService,
        private readonly tenantsService: TenantsService
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        // 1. Resolve from subdomain if possible
        const host = request.headers.host || '';
        const subdomain = host.split('.')[0];

        // Skip for main domain or common subdomains
        const isMainDomain = host.includes('api.neqtra.com') || subdomain === 'www' || subdomain === 'api';

        if (!isMainDomain && subdomain) {
            return from(this.tenantsService.findBySubdomain(subdomain)).pipe(
                switchMap(tenant => {
                    const tenantId = tenant?.id || request.headers['x-tenant-id'] || request.user?.tenantId;
                    if (tenantId) {
                        this.cls.set('tenantId', tenantId);
                        request.tenantId = tenantId; // Also attach to request for easy access
                    }
                    return next.handle();
                })
            );
        }

        // 2. Fallback to headers or user context
        const tenantId = request.headers['x-tenant-id'] || request.user?.tenantId || request.user?.tenant?.id;
        if (tenantId) {
            this.cls.set('tenantId', tenantId);
        }

        return next.handle();
    }
}
