import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenancyService } from '../tenancy/tenancy.service';

@Injectable()
export class TenantsService {
    private readonly logger = new Logger(TenantsService.name);

    constructor(
        @InjectRepository(Tenant)
        private tenantsRepository: Repository<Tenant>,
        private dataSource: DataSource,
        private tenancyService: TenancyService,
    ) { }

    async create(createTenantDto: Partial<Tenant>): Promise<Tenant> {
        const tenant = this.tenantsRepository.create(createTenantDto);
        const savedTenant = await this.tenantsRepository.save(tenant);

        // Provision dynamic database
        const dbName = `tenant_${savedTenant.id.replace(/-/g, '_')}`;
        this.logger.log(`Provisioning physical database isolated for tenant: ${dbName}`);

        try {
            await this.dataSource.query(`CREATE DATABASE "${dbName}"`);
            this.logger.log(`Successfully created database ${dbName}`);
        } catch (error: any) {
            // Error code 42P04 means database already exists
            if (error.code !== '42P04') {
                this.logger.error(`Failed to create database ${dbName}`, error);
                throw error;
            } else {
                this.logger.warn(`Database ${dbName} already exists, proceeding to schema sync.`);
            }
        }

        // Initialize connection to create tables automatically in the background
        // Removing 'await' here eliminates the 5-10 second latency during signup
        this.tenancyService.getTenantDataSource(savedTenant.id)
            .then(() => this.logger.log(`Background schema sync completed for ${dbName}`))
            .catch(e => this.logger.error(`Background schema sync failed for ${dbName}`, e));

        return savedTenant;
    }

    async findOne(id: string): Promise<Tenant | null> {
        return this.tenantsRepository.findOne({ where: { id } });
    }

    async findBySubdomain(subdomain: string): Promise<Tenant | null> {
        return this.tenantsRepository.findOne({ where: { subdomain } });
    }

    async updateProfile(id: string, updateData: Partial<Tenant>): Promise<Tenant> {
        const tenant = await this.findOne(id);
        if (!tenant) {
            throw new NotFoundException(`Tenant with ID ${id} not found`);
        }
        Object.assign(tenant, updateData);
        return await this.tenantsRepository.save(tenant);
    }

    async delete(id: string): Promise<void> {
        const tenant = await this.findOne(id);
        if (!tenant) {
            throw new NotFoundException(`Tenant with ID ${id} not found`);
        }

        const dbName = `tenant_${id.replace(/-/g, '_')}`;
        this.logger.log(`Deleting tenant: ${tenant.name} (${id}) and dropping database: ${dbName}`);

        // 1. Close the cached DataSource in TenancyService
        await this.tenancyService.closeTenantDataSource(id);

        try {
            // 2. Terminate any active connections to the tenant database
            // This is necessary because DROP DATABASE fails if there are active connections
            await this.dataSource.query(`
                SELECT pg_terminate_backend(pid) 
                FROM pg_stat_activity 
                WHERE datname = '${dbName}' AND pid <> pg_backend_pid();
            `);

            // 3. Drop the physical database
            await this.dataSource.query(`DROP DATABASE IF EXISTS "${dbName}"`);
            this.logger.log(`Successfully dropped database ${dbName}`);
        } catch (error) {
            this.logger.error(`Error dropping database ${dbName}:`, error);
            // We continue even if DB drop fails, so we can at least remove the tenant record
        }

        // 4. Delete the tenant record (Cascade handles users, branches, etc. in main DB)
        await this.tenantsRepository.delete(id);
        this.logger.log(`Tenant record deleted: ${id}`);
    }

    getPlanQuotas(plan: string) {
        const p = plan.toUpperCase();
        switch (p) {
            case 'ENTERPRISE':
                return {
                    maxDevices: 50,
                    maxBranches: 20,
                    maxUsers: 100,
                    features: { inventory: true, analytics: true, advancedReports: true, multiBranch: true }
                };
            case 'PRO':
            case 'GROWTH':
                return {
                    maxDevices: 10,
                    maxBranches: 5,
                    maxUsers: 25,
                    features: { inventory: true, analytics: true, advancedReports: true, multiBranch: true }
                };
            case 'STARTER':
                return {
                    maxDevices: 2,
                    maxBranches: 1,
                    maxUsers: 5,
                    features: { inventory: true, analytics: true, advancedReports: false, multiBranch: false }
                };
            case 'FREE':
            case 'TRIAL':
            default:
                return {
                    maxDevices: 1,
                    maxBranches: 1,
                    maxUsers: 2,
                    features: { inventory: true, analytics: false, advancedReports: false, multiBranch: false }
                };
        }
    }
}
