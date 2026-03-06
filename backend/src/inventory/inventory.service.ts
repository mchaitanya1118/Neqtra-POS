import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InventoryItem } from './entities/inventory.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private repo: Repository<InventoryItem>,
    private readonly notificationsService: NotificationsService,
  ) { }

  create(createDto: CreateInventoryDto) {
    const item = this.repo.create(createDto);
    return this.repo.save(item);
  }

  async findAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.repo.findAndCount({
      order: { name: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  async update(id: number, updateDto: UpdateInventoryDto) {
    await this.repo.update(id, updateDto);
    const updated = await this.repo.findOneBy({ id });

    if (updated && updated.quantity <= updated.threshold) {
      this.notificationsService.create({
        title: 'Low Stock Alert',
        message: `${updated.name} is running low (${updated.quantity} ${updated.unit} left).`,
        type: NotificationType.WARNING,
      });
    }

    return updated;
  }

  async remove(id: number) {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new Error(`Inventory item with ID ${id} not found`);
    }
    return result;
  }
}
