import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delivery } from './entities/delivery.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Delivery, Order])],
    controllers: [DeliveryController],
    providers: [DeliveryService],
    exports: [DeliveryService],
})
export class DeliveryModule { }
