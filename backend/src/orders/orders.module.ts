import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { Table } from '../entities/table.entity';
import { KitchenGateway } from './kitchen.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, MenuItem, Table, Payment]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, KitchenGateway],
  exports: [KitchenGateway], // Export if needed by other modules
})
export class OrdersModule {}
