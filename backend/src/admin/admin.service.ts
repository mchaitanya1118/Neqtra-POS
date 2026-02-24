import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantsService } from '../tenants/tenants.service';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(Tenant)
        private tenantRepo: Repository<Tenant>,
        private tenantsService: TenantsService,
        private auditService: AdminAuditService
    ) { }

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
        const updated = await this.tenantRepo.save(tenant);
        await this.auditService.log('UPDATE_SUBSCRIPTION', adminUser, id, { oldPlan, newPlan: plan });
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

            // Delete raw to bypass entity load hanging and directly hit DB constraints
            await this.tenantRepo.delete(id);

            return { message: 'Tenant successfully deleted' };
        } catch (error) {
            console.error('Error deleting tenant:', error);
            throw error;
        }
    }
}
