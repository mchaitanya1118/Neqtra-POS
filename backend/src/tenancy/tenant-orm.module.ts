import { DynamicModule, Provider, Global, Module, Scope } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { TenancyService } from './tenancy.service';

@Global()
@Module({})
export class TenantOrmModule {
    static forFeature(entities: Function[]): DynamicModule {
        const providers: Provider[] = entities.map((entity) => ({
            provide: getRepositoryToken(entity),
            scope: Scope.REQUEST,
            inject: [ClsService, TenancyService],
            useFactory: async (cls: ClsService, tenancyService: TenancyService) => {
                const tenantId = cls.get('tenantId');
                if (!tenantId) {
                    throw new Error('Tenant ID not found in current execution context. Ensure this is called with a valid tenant token.');
                }
                const dataSource = await tenancyService.getTenantDataSource(tenantId);
                return dataSource.getRepository(entity);
            },
        }));

        return {
            module: TenantOrmModule,
            providers: providers,
            exports: providers,
        };
    }
}
