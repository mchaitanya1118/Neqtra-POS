import { Injectable, Logger } from '@nestjs/common';
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

        // Initialize connection to create tables automatically
        await this.tenancyService.getTenantDataSource(savedTenant.id);

        return savedTenant;
    }

    async findOne(id: string): Promise<Tenant | null> {
        return this.tenantsRepository.findOne({ where: { id } });
    }

    async updateProfile(id: string, updateData: Partial<Tenant>): Promise<Tenant> {
        const tenant = await this.findOne(id);
        if (!tenant) {
            throw new Error(`Tenant with ID ${id} not found`);
        }
        Object.assign(tenant, updateData);
        return await this.tenantsRepository.save(tenant);
    }
}
