import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationsRepository: Repository<Notification>,
        private readonly notificationsGateway: NotificationsGateway,
    ) { }

    async findAll() {
        return this.notificationsRepository.find({
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }

    async create(data: { title: string; message: string; type: NotificationType }) {
        const notification = this.notificationsRepository.create(data);
        const saved = await this.notificationsRepository.save(notification);

        // Broadcast to all connected clients
        this.notificationsGateway.broadcastNotification(saved);

        return saved;
    }

    async markAsRead(id: number) {
        await this.notificationsRepository.update(id, { read: true });
        return { success: true };
    }

    async markAllAsRead() {
        await this.notificationsRepository.update({ read: false }, { read: true });
        return { success: true };
    }

    async delete(id: number) {
        await this.notificationsRepository.delete(id);
        return { success: true };
    }

    async clearAll() {
        await this.notificationsRepository.clear();
        return { success: true };
    }
}
