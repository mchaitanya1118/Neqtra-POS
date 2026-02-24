import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantOrmModule } from '../tenancy/tenant-orm.module';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Payment } from '../payments/entities/payment.entity';

import { Expense } from '../expenses/entities/expense.entity';

import { OrderEvent } from '../orders/entities/order-event.entity';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TenantOrmModule.forFeature([Order, Payment, Expense, OrderEvent]), TenantsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule { }
