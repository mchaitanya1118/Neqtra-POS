import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Table } from '../entities/table.entity';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
    private razorpay: Razorpay;
    private PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT';
    private PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
    private PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
    private PHONEPE_HOST_URL = process.env.PHONEPE_HOST_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox';

    constructor(
        @InjectRepository(Payment)
        private paymentRepo: Repository<Payment>,
        @InjectRepository(Order)
        private orderRepo: Repository<Order>,
        @InjectRepository(Customer)
        private customerRepo: Repository<Customer>,
        @InjectRepository(Table)
        private tableRepo: Repository<Table>,
    ) {
        this.razorpay = new Razorpay({
            key_id: 'rzp_test_S8BPowIgENgSYn',
            key_secret: 'ndxHEDNLFEEr1EgFMr61WCxB',
        });
    }

    async processPayment(orderId: number, amount?: number, method: string = 'CASH', transactionId?: string) {
        console.log(`[processPayment] Processing payment for Order ID: ${orderId}`);

        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['payments'],
        });

        if (!order) throw new NotFoundException('Order not found');

        const table = await this.tableRepo.findOneBy({ label: order.tableName });

        // Calculate totals
        const currentPaid = order.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        const subTotal = Number(order.totalAmount);
        let discountVal = 0;
        if (order.discountType === 'PERCENT') {
            discountVal = subTotal * (Number(order.discount) / 100);
        } else {
            discountVal = Number(order.discount);
        }
        const totalDue = Math.max(0, subTotal - discountVal);
        const currentRemaining = totalDue - currentPaid;

        const payAmount = amount === undefined || amount === null ? currentRemaining : amount;

        if (payAmount > 0.01) {
            if (method === 'DUE' || method === 'ON_ACCOUNT') {
                if (!order.customerId) {
                    throw new BadRequestException('Customer must be assigned to settle as DUE');
                }
                const customer = await this.customerRepo.findOneBy({ id: order.customerId });
                if (customer) {
                    customer.totalDue += payAmount;
                    await this.customerRepo.save(customer);
                }
            }

            const payment = this.paymentRepo.create({
                amount: payAmount,
                method,
                transactionId,
                status: 'COMPLETED',
                order,
            });
            await this.paymentRepo.save(payment);

            if (!order.payments) order.payments = [];
            order.payments.push(payment);
        }

        // Re-calculate status
        const newTotalPaid = (order.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
        const remaining = totalDue - newTotalPaid;

        if (remaining <= 0.01) {
            order.status = (method === 'ON_ACCOUNT' || method === 'DUE') ? 'DUE' : 'COMPLETED';
            if (table && table.status === 'OCCUPIED') {
                table.status = 'FREE';
                await this.tableRepo.save(table);
            }
            await this.orderRepo.save(order);
            return { message: 'Payment Successful', status: order.status, remaining: 0 };
        } else {
            order.status = 'PARTIAL';
            await this.orderRepo.save(order);
            return { message: 'Partial Payment Recorded', status: 'PARTIAL', remaining };
        }
    }

    // Razorpay
    async createRazorpayOrder(orderId: number, amount: number) {
        const order = await this.orderRepo.findOneBy({ id: orderId });
        if (!order) throw new NotFoundException('Order not found');

        const options = {
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `order_rcptid_${orderId}_${Date.now()}`,
        };

        try {
            const response = await this.razorpay.orders.create(options);
            return {
                id: response.id,
                currency: response.currency,
                amount: response.amount,
            };
        } catch (error) {
            console.error('Razorpay Create Order Failed', error);
            throw new BadRequestException('Failed to create Razorpay order');
        }
    }

    async verifyRazorpayPayment(orderId: number, paymentId: string, orderRpId: string, signature: string, amount: number) {
        const generated_signature = crypto
            .createHmac('sha256', 'ndxHEDNLFEEr1EgFMr61WCxB')
            .update(orderRpId + '|' + paymentId)
            .digest('hex');

        if (generated_signature === signature) {
            return await this.processPayment(orderId, amount, 'ONLINE', paymentId);
        } else {
            throw new BadRequestException('Payment Verification Failed');
        }
    }

    // PhonePe
    async initiatePhonePePayment(orderId: number, amount: number) {
        const order = await this.orderRepo.findOneBy({ id: orderId });
        if (!order) throw new NotFoundException('Order not found');

        const transactionId = `TXN_${orderId}_${Date.now()}`;
        const amountInPaise = Math.round(amount * 100);

        const payload = {
            merchantId: this.PHONEPE_MERCHANT_ID,
            merchantTransactionId: transactionId,
            merchantUserId: 'MUID_' + (order.customerId || 'GUEST'),
            amount: amountInPaise,
            redirectUrl: `http://localhost:3000/api/payment/redirect`,
            redirectMode: 'POST',
            callbackUrl: `http://localhost:3001/orders/webhook/phonepe`,
            paymentInstrument: { type: 'PAY_PAGE' },
        };

        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const apiPath = '/pg/v1/pay';
        const checksum = crypto.createHash('sha256').update(base64Payload + apiPath + this.PHONEPE_SALT_KEY).digest('hex') + '###' + this.PHONEPE_SALT_INDEX;

        try {
            const response = await fetch(`${this.PHONEPE_HOST_URL}${apiPath}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum,
                },
                body: JSON.stringify({ request: base64Payload }),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new BadRequestException(`PhonePe API Failed: ${errText}`);
            }

            const data = await response.json();
            if (data.success) {
                return {
                    url: data.data.instrumentResponse.redirectInfo.url,
                    merchantTransactionId: transactionId,
                };
            } else {
                throw new BadRequestException(`PhonePe Error: ${data.message}`);
            }
        } catch (e: any) {
            throw new BadRequestException(e.message || 'Payment init failed');
        }
    }

    async checkPhonePeStatus(orderId: number, merchantTransactionId: string, amount: number) {
        const apiPath = `/pg/v1/status/${this.PHONEPE_MERCHANT_ID}/${merchantTransactionId}`;
        const checksum = crypto.createHash('sha256').update(apiPath + this.PHONEPE_SALT_KEY).digest('hex') + '###' + this.PHONEPE_SALT_INDEX;

        try {
            const response = await fetch(`${this.PHONEPE_HOST_URL}${apiPath}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum,
                    'X-MERCHANT-ID': this.PHONEPE_MERCHANT_ID,
                },
            });

            if (!response.ok) throw new BadRequestException('Failed to check status');
            const data = await response.json();

            if (data.code === 'PAYMENT_SUCCESS') {
                return await this.processPayment(orderId, amount, 'PHONEPE', merchantTransactionId);
            } else if (data.code === 'PAYMENT_PENDING') {
                return { status: 'PENDING', message: 'Payment is still processing' };
            } else {
                return { status: 'FAILED', message: data.message || 'Payment Failed' };
            }
        } catch (e: any) {
            throw new BadRequestException('Status check failed');
        }
    }
}
