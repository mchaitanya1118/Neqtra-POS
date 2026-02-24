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
import { KitchenGateway } from './kitchen.gateway';
import { NotificationsModule } from '../notifications/notifications.module';

import { OrderEvent } from './entities/order-event.entity';

import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TenantOrmModule.forFeature([Order, OrderItem, MenuItem, Table, Payment, Customer, Delivery, OrderEvent]),
    NotificationsModule,
    PaymentsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, KitchenGateway],
  exports: [KitchenGateway], // Export if needed by other modules
})
export class OrdersModule { }
