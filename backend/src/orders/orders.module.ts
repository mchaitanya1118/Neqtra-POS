import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantOrmModule } from '../tenancy/tenant-orm.module';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Customer } from '../customers/entities/customer.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { Table } from '../entities/table.entity';
import { Delivery } from '../delivery/entities/delivery.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrderEvent } from './entities/order-event.entity';
import { InventoryItem } from '../inventory/entities/inventory.entity';
import { PaymentsModule } from '../payments/payments.module';

import { BullModule } from '@nestjs/bullmq';
import { OrdersProcessor } from './orders.processor';

@Module({
  imports: [
    TenantOrmModule.forFeature([Order, OrderItem, MenuItem, Table, Payment, Customer, Delivery, OrderEvent, InventoryItem]),
    NotificationsModule,
    PaymentsModule,
    BullModule.registerQueue({
      name: 'orders',
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersProcessor],
})
export class OrdersModule { }
