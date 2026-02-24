import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TenantOrmModule } from '../tenancy/tenant-orm.module';
import { Order } from '../orders/entities/order.entity';
import { InventoryItem } from '../inventory/entities/inventory.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Table } from '../entities/table.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Payment } from '../payments/entities/payment.entity';

@Module({
  imports: [
    TenantOrmModule.forFeature([
      Order,
      InventoryItem,
      Reservation,
      Table,
      Customer,
      Payment
    ])
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService]
})
export class DashboardModule { }
