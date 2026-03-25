import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Order } from '../orders/entities/order.entity';
import { InventoryItem } from '../inventory/entities/inventory.entity';
import { TenantOrmModule } from '../tenancy/tenant-orm.module';

@Module({
  imports: [
    PassportModule,
    TenantOrmModule.forFeature([Order, InventoryItem]),
  ],

  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule { }
