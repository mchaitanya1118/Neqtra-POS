import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../entities/user.entity';
import { Device } from '../devices/entities/device.entity';
import { Invoice } from '../subscriptions/entities/invoice.entity';
import { TenantsService } from '../tenants/tenants.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { AdminAuditService } from './admin-audit.service';
import * as os from 'os';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(Tenant)
        private tenantRepo: Repository<Tenant>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(Device)
        private deviceRepo: Repository<Device>,
        @InjectRepository(Invoice)
        private invoiceRepo: Repository<Invoice>,
        private tenantsService: TenantsService,
        private tenancyService: TenancyService,
        private auditService: AdminAuditService
    ) { }

    async getGlobalMetrics() {
        const totalTenants = await this.tenantRepo.count();
        const activeTenants = await this.tenantRepo.count({ where: { status: 'ACTIVE' } });
        const totalDevices = await this.deviceRepo.count({ where: { status: 'ACTIVE' } });
        const totalUsers = await this.userRepo.count();

        // Calculate real monthly revenue from PAID invoices
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const revenueResult = await this.invoiceRepo
            .createQueryBuilder('invoice')
            .select('SUM(invoice.amount)', 'total')
            .where('invoice.status = :status', { status: 'PAID' })
            .andWhere('invoice.createdAt >= :startOfMonth', { startOfMonth })
            .getRawOne();

        const monthlyRevenue = parseFloat(revenueResult?.total || '0');

        // Calculate total database usage across all tenants
        const tenants = await this.tenantRepo.find({ select: ['id'] });
        let totalDbSize = 0;

        for (const tenant of tenants) {
            const dbName = `tenant_${tenant.id.replace(/-/g, '_')}`;
            try {
                const result = await this.tenantRepo.query(`SELECT pg_database_size('${dbName}') as size`);
                if (result && result[0]) {
                    totalDbSize += parseInt(result[0].size);
                }
            } catch (e) {
                // Database might not exist yet or be in deletion
            }
        }

        return {
            totalTenants,
            activeTenants,
            totalDevices,
            totalUsers,
            totalDatabaseSize: totalDbSize, // in bytes
            totalDatabaseSizeFormatted: (totalDbSize / (1024 * 1024)).toFixed(2) + ' MB',
            monthlyRevenue,
            systemHealth: 'HEALTHY',
        };
    }

    async getTenantMetrics(id: string) {
        const tenant = await this.tenantRepo.findOneBy({ id });
        if (!tenant) throw new NotFoundException('Tenant not found');

        const dbName = `tenant_${id.replace(/-/g, '_')}`;
        let dbSize = 0;
        try {
            const result = await this.tenantRepo.query(`SELECT pg_database_size('${dbName}') as size`);
            if (result && result[0]) {
                dbSize = parseInt(result[0].size);
            }
        } catch (e) { }

        return {
            tenantId: id,
            name: tenant.name,
            plan: tenant.subscriptionPlan,
            status: tenant.status,
            databaseSize: dbSize,
            databaseSizeFormatted: (dbSize / (1024 * 1024)).toFixed(2) + ' MB',
            // Add more specific metrics here if needed (e.g., last 30 days orders)
        };
    }

    async createTenant(name: string, subscriptionPlan: string = 'BASIC', adminUser: any) {
        const tenant = await this.tenantsService.create({
            name,
            subscriptionPlan,
            status: 'ACTIVE',
        });
        await this.auditService.log('CREATE_TENANT', adminUser, tenant.id, { name, subscriptionPlan });
        return tenant;
    }

    async findAll() {
        return await this.tenantRepo.find();
    }

    async updateSubscription(id: string, plan: string, adminUser: any) {
        const tenant = await this.tenantRepo.findOneBy({ id });
        if (!tenant) throw new NotFoundException('Tenant not found');
        const oldPlan = tenant.subscriptionPlan;

        tenant.subscriptionPlan = plan;

        // Update quotas based on the new plan
        const quotas = this.tenantsService.getPlanQuotas(plan);
        tenant.maxDevices = quotas.maxDevices;
        tenant.maxBranches = quotas.maxBranches;
        tenant.maxUsers = quotas.maxUsers;
        tenant.features = quotas.features;

        const updated = await this.tenantRepo.save(tenant);
        await this.auditService.log('UPDATE_SUBSCRIPTION', adminUser, id, {
            oldPlan,
            newPlan: plan,
            quotas
        });
        return updated;
    }

    async updateQuotas(id: string, quotas: { maxUsers?: number; maxTables?: number }, adminUser: any) {
        const tenant = await this.tenantRepo.findOneBy({ id });
        if (!tenant) throw new NotFoundException('Tenant not found');
        if (quotas.maxUsers !== undefined) tenant.maxUsers = quotas.maxUsers;
        if (quotas.maxTables !== undefined) tenant.maxTables = quotas.maxTables;
        const updated = await this.tenantRepo.save(tenant);
        await this.auditService.log('UPDATE_QUOTAS', adminUser, id, quotas);
        return updated;
    }

    async toggleStatus(id: string, adminUser: any) {
        const tenant = await this.tenantRepo.findOneBy({ id });
        if (!tenant) throw new NotFoundException('Tenant not found');
        const oldStatus = tenant.status;
        tenant.status = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        const updated = await this.tenantRepo.save(tenant);
        await this.auditService.log('TOGGLE_STATUS', adminUser, id, { oldStatus, newStatus: tenant.status });
        return updated;
    }

    async deleteTenant(id: string, adminUser: any) {
        try {
            const tenant = await this.tenantRepo.findOneBy({ id });
            if (!tenant) throw new NotFoundException('Tenant not found');

            // Log first before deleting just in case
            await this.auditService.log('DELETE_TENANT', adminUser, id, { name: tenant.name });

            // Use the robust delete method from TenantsService that also drops the physical DB
            await this.tenantsService.delete(id);

            return { message: 'Tenant successfully deleted' };
        } catch (error) {
            console.error('Error deleting tenant:', error);
            throw error;
        }
    }

    async getPlatformHealth() {
        const tenants = await this.tenantRepo.find();
        const healthStatus = await Promise.all(tenants.map(async (tenant) => {
            let status = 'ONLINE';
            try {
                // Try to get connection, which will fail if DB is unreachable
                await this.tenancyService.getTenantDataSource(tenant.id);
            } catch (err) {
                status = 'OFFLINE';
            }
            return {
                id: tenant.id,
                name: tenant.name,
                status,
                lastSeen: new Date(),
            };
        }));

        const totalDbSize = await this.getTotalDatabaseSize();

        return {
            status: healthStatus.every(s => s.status === 'ONLINE') ? 'HEALTHY' : 'DEGRADED',
            tenants: healthStatus,
            storageUsage: (totalDbSize / (1024 * 1024)).toFixed(2) + ' MB',
            timestamp: new Date(),
        };
    }

    async getTelemetry() {
        const memoryUsage = process.memoryUsage();

        return {
            process: {
                uptime: process.uptime(),
                pid: process.pid,
                memory: {
                    rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
                    heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
                    heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
                    external: (memoryUsage.external / 1024 / 1024).toFixed(2) + ' MB',
                }
            },
            system: {
                platform: os.platform(),
                release: os.release(),
                totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                cpus: os.cpus().length,
                loadAverage: os.loadavg()
            },
            timestamp: new Date()
        };
    }

    private async getTotalDatabaseSize() {
        const result = await this.tenantRepo.query(`
            SELECT sum(pg_database_size(datname)) as total_size 
            FROM pg_database 
            WHERE datname LIKE 'tenant_%'
        `);
        return parseInt(result[0]?.total_size || '0');
    }
}
