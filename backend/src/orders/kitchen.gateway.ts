import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class KitchenGateway {
  @WebSocketServer()
  server: Server;

  // Method to broadcast new orders to all connected kitchen clients
  broadcastNewOrder(order: any) {
    this.server.emit('new_order', order);
  }
}
