import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get('stats')
  getStats() {
    return this.ordersService.getStats();
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }

  @Post(':id/settle')
  settle(
    @Param('id') id: string,
    @Body() body: { amount?: number; method?: string } = {},
  ) {
    return this.ordersService.settle(+id, body?.amount, body?.method);
  }

  @Post(':id/serve')
  markServed(@Param('id') id: string) {
    return this.ordersService.markServed(+id);
  }

  @Get(':id/active')
  getActiveOrder(@Param('id') id: string) {
    return this.ordersService.getActiveOrder(+id);
  }

  @Post(':id/move')
  moveOrder(@Param('id') id: string, @Body() body: { targetTableId: number }) {
    return this.ordersService.moveOrder(+id, body.targetTableId);
  }

  @Post(':id/razorpay-order')
  createRazorpayOrder(
    @Param('id') id: string,
    @Body() body: { amount: number },
  ) {
    return this.ordersService.createRazorpayOrder(+id, body.amount);
  }

  @Post(':id/razorpay-verify')
  verifyRazorpayPayment(
    @Param('id') id: string,
    @Body()
    body: {
      paymentId: string;
      orderRpId: string;
      signature: string;
      amount: number;
    },
  ) {
    return this.ordersService.verifyRazorpayPayment(
      +id,
      body.paymentId,
      body.orderRpId,
      body.signature,
      body.amount,
    );
  }

  @Post(':id/phonepe-init')
  initiatePhonePePayment(
    @Param('id') id: string,
    @Body() body: { amount: number },
  ) {
    return this.ordersService.initiatePhonePePayment(+id, body.amount);
  }

  @Post(':id/phonepe-check-status')
  checkPhonePeStatus(
    @Param('id') id: string,
    @Body() body: { merchantTransactionId: string; amount: number },
  ) {
    return this.ordersService.checkPhonePeStatus(
      +id,
      body.merchantTransactionId,
      body.amount,
    );
  }
}
