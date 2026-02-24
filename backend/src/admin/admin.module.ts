import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantsModule } from '../tenants/tenants.module';
import { AdminAuditService } from './admin-audit.service';
import { SuperAdminAuditLog } from './entities/audit-log.entity';
import { User } from '../entities/user.entity';
import { GlobalStatsService } from './global-stats.service';
import { GlobalStatsController } from './global-stats.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Tenant, SuperAdminAuditLog, User]), TenantsModule],
    controllers: [AdminController, GlobalStatsController],
    providers: [AdminService, AdminAuditService, GlobalStatsService],
    exports: [AdminAuditService],
})
export class AdminModule { }
