import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantOrmModule } from '../tenancy/tenant-orm.module';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { Customer } from './entities/customer.entity';
import { DuesPayment } from './entities/dues-payment.entity';
import { Order } from '../orders/entities/order.entity';
import { NotificationsModule } from '../notifications/notifications.module';

import { OrderEvent } from '../orders/entities/order-event.entity';

@Module({
  imports: [
    TenantOrmModule.forFeature([Customer, DuesPayment, Order, OrderEvent]),
    NotificationsModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule { }
