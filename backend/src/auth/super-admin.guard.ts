import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        const userRole = user.roleRel?.name || user.role;
        if (userRole !== 'SuperAdmin') {
            throw new ForbiddenException('Restricted to SuperAdmin');
        }

        return true;
    }
}
