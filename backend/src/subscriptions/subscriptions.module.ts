import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { Tenant } from '../tenants/entities/tenant.entity';
import { BranchesModule } from '../branches/branches.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
    imports: [TypeOrmModule.forFeature([Tenant]), BranchesModule, DevicesModule],
    controllers: [SubscriptionsController],
    providers: [SubscriptionsService],
    exports: [SubscriptionsService],
})
export class SubscriptionsModule { }
