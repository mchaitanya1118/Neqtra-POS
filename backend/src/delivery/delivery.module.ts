import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantOrmModule } from '../tenancy/tenant-orm.module';
import { Delivery } from './entities/delivery.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderEvent } from '../orders/entities/order-event.entity';

@Module({
    imports: [TenantOrmModule.forFeature([Delivery, Order, OrderEvent])],
    controllers: [DeliveryController],
    providers: [DeliveryService],
    exports: [DeliveryService],
})
export class DeliveryModule { }
