import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { Customer } from './entities/customer.entity';
import { DuesPayment } from './entities/dues-payment.entity';
import { Order } from '../orders/entities/order.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, DuesPayment, Order]),
    NotificationsModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule { }
