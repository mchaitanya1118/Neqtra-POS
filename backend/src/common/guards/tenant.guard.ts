
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.tenant) {
            throw new UnauthorizedException('Tenant context missing');
        }

        // Check if the request header (if present) matches the token tenant
        const headerTenantId = request.headers['x-tenant-id'];
        if (headerTenantId && user.tenant.id !== headerTenantId) {
            throw new UnauthorizedException('Tenant ID mismatch');
        }

        return true;
    }
}
