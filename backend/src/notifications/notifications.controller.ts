import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './entities/notification.entity';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    findAll() {
        return this.notificationsService.findAll();
    }

    @Post()
    create(@Body() data: { title: string; message: string; type: NotificationType }) {
        return this.notificationsService.create(data);
    }

    @Patch('read-all')
    markAllAsRead() {
        return this.notificationsService.markAllAsRead();
    }

    @Patch(':id/read')
    markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(+id);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.notificationsService.delete(+id);
    }

    @Delete()
    clearAll() {
        return this.notificationsService.clearAll();
    }
}
