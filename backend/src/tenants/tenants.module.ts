import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { TenantSetting } from './entities/tenant-setting.entity';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';

import { ProvisioningService } from './provisioning.service';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { BranchesModule } from '../branches/branches.module';

import { SuperAdminAuditLog } from '../admin/entities/audit-log.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Tenant, Plan, Subscription, TenantSetting, SuperAdminAuditLog]),
        RolesModule,
        UsersModule,
        forwardRef(() => BranchesModule)
    ],
    controllers: [TenantsController],
    providers: [TenantsService, ProvisioningService],
    exports: [TenantsService, ProvisioningService, TypeOrmModule],
})
export class TenantsModule { }
