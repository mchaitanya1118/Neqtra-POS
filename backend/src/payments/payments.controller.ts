import { Controller, Post, Body, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post(':orderId/process')
    process(
        @Param('orderId') orderId: string,
        @Body() body: { amount?: number; method?: string; transactionId?: string },
    ) {
        return this.paymentsService.processPayment(+orderId, body.amount, body.method, body.transactionId);
    }

    @Post(':orderId/razorpay-init')
    createRazorpayOrder(@Param('orderId') orderId: string, @Body() body: { amount: number }) {
        return this.paymentsService.createRazorpayOrder(+orderId, body.amount);
    }

    @Post(':orderId/razorpay-verify')
    verifyRazorpayPayment(
        @Param('orderId') orderId: string,
        @Body() body: { paymentId: string; orderRpId: string; signature: string; amount: number },
    ) {
        return this.paymentsService.verifyRazorpayPayment(+orderId, body.paymentId, body.orderRpId, body.signature, body.amount);
    }

    @Post(':orderId/phonepe-init')
    initiatePhonePePayment(@Param('orderId') orderId: string, @Body() body: { amount: number }) {
        return this.paymentsService.initiatePhonePePayment(+orderId, body.amount);
    }

    @Post(':orderId/phonepe-check')
    checkPhonePeStatus(
        @Param('orderId') orderId: string,
        @Body() body: { merchantTransactionId: string; amount: number },
    ) {
        return this.paymentsService.checkPhonePeStatus(+orderId, body.merchantTransactionId, body.amount);
    }
}
