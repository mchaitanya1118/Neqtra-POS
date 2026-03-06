import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(
        @InjectRepository(Tenant)
        private tenantRepository: Repository<Tenant>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // SuperAdmin bypasses subscription checks
        if (user?.role === 'SuperAdmin' || user?.roleRel?.name === 'SuperAdmin') {
            return true;
        }

        if (!user || !user.tenantId) {
            throw new UnauthorizedException('Tenant context missing');
        }

        const tenant = await this.tenantRepository.findOne({ where: { id: user.tenantId } });

        if (!tenant) {
            throw new ForbiddenException('Tenant not found');
        }

        // 1. Check Status
        if (tenant.status === 'SUSPENDED') {
            throw new ForbiddenException('Your account has been suspended. Please contact support.');
        }

        if (tenant.status === 'INACTIVE') {
            throw new ForbiddenException('Your account is inactive.');
        }

        // 2. Check Subscription Expiry
        if (tenant.subscriptionExpiry && new Date(tenant.subscriptionExpiry) < new Date()) {
            // Allow limited access if needed, but for now block
            throw new ForbiddenException('Your subscription has expired. Please renew to continue.');
        }

        return true;
    }
}
