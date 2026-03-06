import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TenantEntities } from './tenant.entities';
import { Client } from 'pg';

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

        try {
            await dataSource.initialize();
            this.tenantDataSources.set(tenantId, dataSource);
            return dataSource;
        } catch (error: any) {
            if (error.code === '3D000') { // Postgres error for "database does not exist"
                this.logger.warn(`Database not found for tenant: ${tenantId}. Auto-provisioning...`);
                const client = new Client({
                    host: this.configService.get<string>('DB_HOST'),
                    port: this.configService.get<number>('DB_PORT'),
                    user: this.configService.get<string>('DB_USERNAME'),
                    password: this.configService.get<string>('DB_PASSWORD'),
                    database: 'postgres',
                });

                try {
                    await client.connect();
                    await client.query(`CREATE DATABASE "${dbName}"`);
                    await client.end();
                    this.logger.log(`Successfully auto-provisioned ${dbName}`);

                    // Retry initialization
                    await dataSource.initialize();
                    this.tenantDataSources.set(tenantId, dataSource);
                    return dataSource;
                } catch (provisionError) {
                    this.logger.error(`Auto-provisioning failed for ${dbName}`, provisionError);
                    throw new Error(`TENANT_DB_NOT_FOUND:${tenantId}`);
                }
            }
            throw error;
        }
    }

    async closeTenantDataSource(tenantId: string): Promise<void> {
        const dataSource = this.tenantDataSources.get(tenantId);
        if (dataSource) {
            this.logger.log(`Closing connection pool for tenant: ${tenantId}`);
            await dataSource.destroy();
            this.tenantDataSources.delete(tenantId);
        }
    }

    async onModuleDestroy() {
        this.logger.log(`Closing all tenant connection pools...`);
        for (const [tenantId, dp] of this.tenantDataSources) {
            await dp.destroy();
        }
    }
}
