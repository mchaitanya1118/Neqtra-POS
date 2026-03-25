import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { TenancyService } from '../tenancy/tenancy.service';

@Injectable()
export class TenantsService {
    private readonly logger = new Logger(TenantsService.name);

    constructor(
        @InjectRepository(Tenant)
        private tenantsRepository: Repository<Tenant>,
        @InjectRepository(Plan)
        private planRepository: Repository<Plan>,
        @InjectRepository(Subscription)
        private subscriptionRepository: Repository<Subscription>,
        private dataSource: DataSource,
        private tenancyService: TenancyService,
    ) { }

    async assignPlan(tenantId: string, planName: string = 'FREE'): Promise<Subscription> {
        let plan = await this.planRepository.findOne({ where: { name: planName } });

        if (!plan) {
            // Create default plan if it doesn't exist
            plan = this.planRepository.create({
                name: 'FREE',
                price: 0,
                quotas: { maxUsers: 2, maxBranches: 1, maxTables: 10, maxDevices: 1 },
                features: { inventory: true, analytics: false, advancedReports: false, multiBranch: false, aiMenuExtraction: false }
            });
            plan = await this.planRepository.save(plan);
        }

        const subscription = this.subscriptionRepository.create({
            tenantId,
            planId: plan.id,
            status: 'ACTIVE',
            startDate: new Date(),
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial/cycle
        });

        const savedSubscription = await this.subscriptionRepository.save(subscription);

        // Update tenant's cached plan info for quick check
        await this.tenantsRepository.update(tenantId, {
            subscriptionPlan: plan.name,
            subscriptionExpiry: subscription.nextBillingDate
        });

        return savedSubscription;
    }

    async create(createTenantDto: Partial<Tenant>): Promise<Tenant> {
        const tenant = this.tenantsRepository.create({
            ...createTenantDto,
            provisioningStatus: 'PENDING'
        });
        const savedTenant = await this.tenantsRepository.save(tenant);

        return savedTenant;
    }

    async findAll(): Promise<Tenant[]> {
        return this.tenantsRepository.find({
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: string): Promise<Tenant | null> {
        return this.tenantsRepository.findOne({
            where: { id },
            relations: ['settings', 'subscriptions', 'subscriptions.plan']
        });
    }

    async findBySubdomain(subdomain: string): Promise<Tenant | null> {
        return this.tenantsRepository.findOne({
            where: { subdomain },
            relations: ['settings', 'subscriptions', 'subscriptions.plan']
        });
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

    async getTenantDataSource(tenantId: string): Promise<DataSource> {
        return this.tenancyService.getTenantDataSource(tenantId);
    }
}
