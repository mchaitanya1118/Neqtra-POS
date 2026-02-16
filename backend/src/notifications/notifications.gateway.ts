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
    namespace: 'notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Client connected to notifications: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected from notifications: ${client.id}`);
    }

    broadcastNotification(notification: any) {
        this.server.emit('new_notification', notification);
    }
}
