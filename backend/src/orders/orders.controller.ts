import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaymentsService } from '../payments/payments.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly paymentsService: PaymentsService,
  ) { }

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
    return this.paymentsService.processPayment(+id, body?.amount, body?.method);
  }

  @Post(':id/serve')
  markServed(@Param('id') id: string) {
    return this.ordersService.markServed(+id);
  }

  @Get(':id/active')
  getActiveOrder(@Param('id') id: string) {
    return this.ordersService.getActiveOrder(+id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; userId?: string },
  ) {
    return this.ordersService.updateStatus(+id, body.status, body.userId);
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
    return this.paymentsService.createRazorpayOrder(+id, body.amount);
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
    return this.paymentsService.verifyRazorpayPayment(
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
    return this.paymentsService.initiatePhonePePayment(+id, body.amount);
  }

  @Post(':id/phonepe-check-status')
  checkPhonePeStatus(
    @Param('id') id: string,
    @Body() body: { merchantTransactionId: string; amount: number },
  ) {
    return this.paymentsService.checkPhonePeStatus(
      +id,
      body.merchantTransactionId,
      body.amount,
    );
  }
}
