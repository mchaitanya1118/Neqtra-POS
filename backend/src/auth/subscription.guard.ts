import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantsService } from '../tenants/tenants.service';

export const PLAN_HIERARCHY = {
    FREE: 0,
    STARTER: 1,
    PRO: 2,
    ENTERPRISE: 3,
    TRIAL: 3, // Trial gets full access
};

export const Plan = (plan: string) => {
    return (target: any, key: string, descriptor: PropertyDescriptor) => {
        Reflector.createDecorator<string>()(plan)(target, key, descriptor);
    };
};

import { SetMetadata } from '@nestjs/common';
export const RequirePlan = (plan: string) => SetMetadata('requirePlan', plan);

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private tenantsService: TenantsService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPlan = this.reflector.get<string>('requirePlan', context.getHandler()) ||
            this.reflector.get<string>('requirePlan', context.getClass());

        if (!requiredPlan) {
            return true; // No plan restriction on this route
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        const userRole = user.roleRel?.name || user.role;
        if (!user || userRole === 'SuperAdmin') {
            return true; // SuperAdmins bypass limits
        }

        const tenantId = user.tenant?.id || user.tenantId;
        if (!tenantId) {
            throw new ForbiddenException('No tenant associated with this user');
        }

        const tenant = await this.tenantsService.findOne(tenantId);
        if (!tenant) {
            throw new ForbiddenException('Tenant not found');
        }

        const currentPlanLevel = PLAN_HIERARCHY[tenant.subscriptionPlan as keyof typeof PLAN_HIERARCHY] || 0;
        const requiredPlanLevel = PLAN_HIERARCHY[requiredPlan as keyof typeof PLAN_HIERARCHY] || 0;

        if (currentPlanLevel < requiredPlanLevel) {
            throw new ForbiddenException(`Access denied. This feature requires the ${requiredPlan} plan or higher.`);
        }

        return true;
    }
}
