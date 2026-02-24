import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
    constructor(private readonly cls: ClsService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        // Support x-tenant-id header or extracted JWT user tenant
        const tenantId = request.headers['x-tenant-id'] || request.user?.tenantId || request.user?.tenant?.id;

        if (tenantId) {
            this.cls.set('tenantId', tenantId);
        }

        return next.handle();
    }
}
