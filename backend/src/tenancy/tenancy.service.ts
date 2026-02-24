import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TenantEntities } from './tenant.entities';

@Injectable()
export class TenancyService implements OnModuleDestroy {
    private tenantDataSources: Map<string, DataSource> = new Map();
    private readonly logger = new Logger(TenancyService.name);

    constructor(private configService: ConfigService) { }

    async getTenantDataSource(tenantId: string): Promise<DataSource> {
        if (this.tenantDataSources.has(tenantId)) {
            return this.tenantDataSources.get(tenantId)!;
        }

        const dbName = `tenant_${tenantId.replace(/-/g, '_')}`;
        this.logger.log(`Initializing new connection pool for: ${dbName}`);

        const dataSource = new DataSource({
            type: 'postgres',
            host: this.configService.get<string>('DB_HOST'),
            port: this.configService.get<number>('DB_PORT'),
            username: this.configService.get<string>('DB_USERNAME'),
            password: this.configService.get<string>('DB_PASSWORD'),
            database: dbName,
            entities: TenantEntities,
            synchronize: process.env.NODE_ENV !== 'production' || process.env.DB_SYNCHRONIZE === 'true',
            extra: {
                max: 2, // Prevent PostgreSQL 'too many clients' max_connections limit error across multiple tenants
            }
        });

        await dataSource.initialize();
        this.tenantDataSources.set(tenantId, dataSource);
        return dataSource;
    }

    async onModuleDestroy() {
        this.logger.log(`Closing all tenant connection pools...`);
        for (const [tenantId, dp] of this.tenantDataSources) {
            await dp.destroy();
        }
    }
}
