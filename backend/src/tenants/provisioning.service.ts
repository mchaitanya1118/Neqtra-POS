import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenancyService } from '../tenancy/tenancy.service';
import * as bcrypt from 'bcrypt';
import { Role } from '../entities/role.entity';
import { Branch } from '../branches/entities/branch.entity';
import { User } from '../entities/user.entity';
import { Tenant } from './entities/tenant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SuperAdminAuditLog } from '../admin/entities/audit-log.entity';

@Injectable()
export class ProvisioningService {
    private readonly logger = new Logger(ProvisioningService.name);

    constructor(
        private tenancyService: TenancyService,
        @InjectRepository(Tenant)
        private tenantsRepository: Repository<Tenant>,
        @InjectRepository(SuperAdminAuditLog)
        private auditLogRepository: Repository<SuperAdminAuditLog>
    ) { }

    async provisionTenant(tenantId: string, adminData: { name: string, email: string, password: string }) {
        this.logger.log(`Starting provisioning for tenant: ${tenantId}`);

        try {
            // 1. Update status to IN_PROGRESS
            await this.tenantsRepository.update(tenantId, { provisioningStatus: 'IN_PROGRESS' });

            await this.auditLogRepository.save({
                action: 'PROVISIONING_STARTED',
                targetTenantId: tenantId,
                details: { timestamp: new Date() }
            });

            // 2. Get/Initialize DataSource (this triggers DB creation and synchronization)
            const dataSource = await this.tenancyService.getTenantDataSource(tenantId, true);

            // 3. Seed initial data (Roles, Admin, Branch)
            await this.seedInitialData(dataSource, adminData, tenantId);

            // 4. Update status to COMPLETED
            await this.tenantsRepository.update(tenantId, { provisioningStatus: 'COMPLETED' });

            await this.auditLogRepository.save({
                action: 'PROVISIONING_COMPLETED',
                targetTenantId: tenantId,
                details: { timestamp: new Date() }
            });

            this.logger.log(`Provisioning completed for tenant: ${tenantId}`);
            return { success: true };
        } catch (error: any) {
            this.logger.error(`Provisioning failed for tenant: ${tenantId}`, error);

            // 5. Update status to FAILED with error log
            await this.tenantsRepository.update(tenantId, {
                provisioningStatus: 'FAILED',
                errorLog: error.message || 'Unknown provisioning error'
            });

            await this.auditLogRepository.save({
                action: 'PROVISIONING_FAILED',
                targetTenantId: tenantId,
                details: { error: error.message, stack: error.stack }
            });

            throw error;
        }
    }

    private async seedInitialData(dataSource: DataSource, adminData: { name: string, email: string, password: string }, tenantId: string) {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Seed Roles
            const roles = [
                { name: 'Admin', permissions: ['*'], isSystem: true },
                { name: 'Manager', permissions: ['orders', 'users', 'reports'], isSystem: true },
                { name: 'Cashier', permissions: ['orders', 'pos'], isSystem: true },
                { name: 'Kitchen', permissions: ['orders'], isSystem: true }
            ];

            for (const role of roles) {
                await queryRunner.manager.insert(Role, role);
            }

            // Get Admin Role
            const adminRole = await queryRunner.manager.findOne(Role, { where: { name: 'Admin' } });
            if (!adminRole) throw new Error('Admin role not found after seeding');

            // Seed Branch
            const branch = await queryRunner.manager.save(Branch, {
                name: 'Main Branch',
                address: 'Headquarters'
            });

            // Seed Admin User
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(adminData.password, salt);

            await queryRunner.manager.save(User, {
                name: adminData.name,
                username: adminData.email,
                password: hashedPassword,
                role: 'Admin',
                tenantId: tenantId,
                branchId: branch.id
            });

            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }
}
