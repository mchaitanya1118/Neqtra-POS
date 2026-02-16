import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { Delivery } from './entities/delivery.entity';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class DeliveryService {
    constructor(
        @InjectRepository(Delivery)
        private deliveryRepo: Repository<Delivery>,
        @InjectRepository(Order)
        private orderRepo: Repository<Order>,
    ) { }

    async create(createDeliveryDto: CreateDeliveryDto) {
        const order = await this.orderRepo.findOneBy({
            id: createDeliveryDto.orderId,
        });
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const delivery = this.deliveryRepo.create(createDeliveryDto);
        delivery.order = order;
        return this.deliveryRepo.save(delivery);
    }

    findAll() {
        return this.deliveryRepo.find({
            relations: ['order', 'order.items', 'order.items.menuItem'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: number) {
        const delivery = await this.deliveryRepo.findOne({
            where: { id },
            relations: ['order', 'order.items', 'order.items.menuItem'],
        });
        if (!delivery) throw new NotFoundException('Delivery not found');
        return delivery;
    }

    async update(id: number, updateDeliveryDto: UpdateDeliveryDto) {
        const delivery = await this.findOne(id);
        Object.assign(delivery, updateDeliveryDto);
        return this.deliveryRepo.save(delivery);
    }

    remove(id: number) {
        return this.deliveryRepo.delete(id);
    }
}
