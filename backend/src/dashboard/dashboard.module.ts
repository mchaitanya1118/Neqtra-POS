import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Order } from '../orders/entities/order.entity';
import { InventoryItem } from '../inventory/entities/inventory.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Table } from '../entities/table.entity';
import { Customer } from '../customers/entities/customer.entity';

import { Payment } from '../orders/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      InventoryItem,
      Reservation,
      Table,
      Customer,
      Payment,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
