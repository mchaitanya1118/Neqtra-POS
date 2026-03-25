import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { Tenant } from '../tenants/entities/tenant.entity';
import { BranchesModule } from '../branches/branches.module';
import { DevicesModule } from '../devices/devices.module';

import { Invoice } from './entities/invoice.entity';
import { TenantsModule } from '../tenants/tenants.module';

import { PhonePeService } from './phonepe.service';

@Module({
    imports: [PassportModule, TypeOrmModule.forFeature([Tenant, Invoice]), BranchesModule, DevicesModule, TenantsModule],
    controllers: [SubscriptionsController],
    providers: [SubscriptionsService, PhonePeService],
    exports: [SubscriptionsService, PhonePeService],
})
export class SubscriptionsModule { }
