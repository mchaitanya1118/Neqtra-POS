import { DynamicModule, Provider, Global, Module, Scope, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { TenancyService } from './tenancy.service';

@Global()
@Module({})
export class TenantOrmModule {
    static forFeature(entities: Function[]): DynamicModule {
        const providers: Provider[] = entities.map((entity) => ({
            provide: getRepositoryToken(entity),
            scope: Scope.REQUEST,
            inject: [ClsService, TenancyService, DataSource],
            useFactory: async (cls: ClsService, tenancyService: TenancyService, defaultDataSource: DataSource) => {
                const tenantId = cls.get('tenantId');
                if (!tenantId) {
                    // Fallback to master DB for superadmin login or pre-tenant requests
                    return defaultDataSource.getRepository(entity);
                }
                try {
                    const dataSource = await tenancyService.getTenantDataSource(tenantId);
                    return dataSource.getRepository(entity);
                } catch (error: any) {
                    if (error.message?.startsWith('TENANT_DB_NOT_FOUND')) {
                        throw new ForbiddenException('Tenant access revoked or database not provisioned.');
                    }
                    throw error;
                }
            },
        }));

        return {
            module: TenantOrmModule,
            providers: providers,
            exports: providers,
        };
    }
}
