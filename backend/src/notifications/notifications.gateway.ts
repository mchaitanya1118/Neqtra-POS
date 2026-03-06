import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'pos', // Changed from 'notifications' to 'pos' for general real-time sync
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join_room')
    handleJoinRoom(client: Socket, tenantId: string) {
        if (tenantId) {
            client.join(`tenant_${tenantId}`);
            console.log(`Client ${client.id} joined room: tenant_${tenantId}`);
            return { event: 'joined', data: tenantId };
        }
    }

    @SubscribeMessage('leave_room')
    handleLeaveRoom(client: Socket, tenantId: string) {
        if (tenantId) {
            client.leave(`tenant_${tenantId}`);
            console.log(`Client ${client.id} left room: tenant_${tenantId}`);
        }
    }

    // Generic broadcast to all in a tenant room
    emitToTenant(tenantId: string, event: string, data: any) {
        this.server.to(`tenant_${tenantId}`).emit(event, data);
    }

    broadcastNotification(notification: any) {
        // Fallback for legacy global notifications, or scoped if notification has tenantId
        if (notification.tenantId) {
            this.emitToTenant(notification.tenantId, 'new_notification', notification);
        } else {
            this.server.emit('new_notification', notification);
        }
    }
}
