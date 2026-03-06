import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { Tenant } from '../tenants/entities/tenant.entity';
import { BranchesService } from '../branches/branches.service';
import { DevicesService } from '../devices/devices.service';

import { Invoice } from './entities/invoice.entity';
import { TenantsService } from '../tenants/tenants.service';
import { PhonePeService } from './phonepe.service';

@Injectable()
export class SubscriptionsService {
    private stripe: Stripe;
    private readonly logger = new Logger(SubscriptionsService.name);

    constructor(
        @InjectRepository(Tenant)
        private tenantRepository: Repository<Tenant>,
        @InjectRepository(Invoice)
        private invoiceRepository: Repository<Invoice>,
        private tenantsService: TenantsService,
        private configService: ConfigService,
        private branchesService: BranchesService,
        private devicesService: DevicesService,
        private phonePeService: PhonePeService,
    ) {
        const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_placeholder';
        this.stripe = new Stripe(stripeKey, {});
    }

    async getQuotaUsage(tenantId: string) {
        const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundException('Tenant not found');

        const activeBranches = await this.branchesService.countActive(tenantId);
        const activeDevices = await this.devicesService.countActive(tenantId);

        const { maxBranches, maxDevices, maxUsers } = this.tenantsService.getPlanQuotas(tenant.subscriptionPlan || 'FREE');

        return {
            plan: tenant.subscriptionPlan,
            usage: {
                branches: {
                    current: activeBranches,
                    max: maxBranches === Infinity ? null : maxBranches
                },
                devices: {
                    current: activeDevices,
                    max: maxDevices === Infinity ? null : maxDevices
                }
            }
        };
    }

    async createCheckoutSession(tenantId: string, priceId: string) {
        const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundException('Tenant not found');

        let customerId = tenant.stripeCustomerId;

        if (!customerId) {
            const customer = await this.stripe.customers.create({
                name: tenant.name,
                metadata: { tenantId: tenant.id },
            });
            customerId = customer.id;
            tenant.stripeCustomerId = customerId;
            await this.tenantRepository.save(tenant);
        }

        const session = await this.stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/admin/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/admin/billing?canceled=true`,
            metadata: { tenantId: tenant.id },
        });

        return { url: session.url };
    }

    async handleWebhook(signature: string, payload: Buffer) {
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        let event: Stripe.Event;

        if (webhookSecret) {
            try {
                event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
            } catch (err: any) {
                this.logger.error(`Webhook signature verification failed: ${err.message}`);
                throw new Error(`Webhook Error: ${err.message}`);
            }
        } else {
            // For testing without webhook secret
            event = JSON.parse(payload.toString()) as Stripe.Event;
        }

        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                const subscription = event.data.object as Stripe.Subscription;
                await this.handleSubscriptionUpdate(subscription);
                break;
            case 'customer.subscription.deleted':
                const canceledSub = event.data.object as Stripe.Subscription;
                await this.handleSubscriptionCancel(canceledSub);
                break;
            default:
                this.logger.log(`Unhandled event type: ${event.type}`);
        }
    }

    private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
        const customerId = subscription.customer as string;
        const tenant = await this.tenantRepository.findOne({ where: { stripeCustomerId: customerId } });

        if (tenant) {
            tenant.stripeSubscriptionId = subscription.id;
            tenant.status = subscription.status === 'active' || subscription.status === 'trialing' ? 'ACTIVE' : 'SUSPENDED';

            // Map stripe price IDs to our plans (in a real app, map this properly)
            // For now we just set to PRO as an example, ideally we check subscription.items.data[0].price.id
            tenant.subscriptionPlan = 'PRO';

            await this.tenantRepository.save(tenant);
            this.logger.log(`Updated tenant ${tenant.id} subscription to ${tenant.subscriptionPlan}`);
        }
    }

    private async handleSubscriptionCancel(subscription: Stripe.Subscription) {
        const customerId = subscription.customer as string;
        const tenant = await this.tenantRepository.findOne({ where: { stripeCustomerId: customerId } });

        if (tenant) {
            tenant.status = 'SUSPENDED';
            tenant.subscriptionPlan = 'FREE';
            await this.tenantRepository.save(tenant);
            this.logger.log(`Suspended tenant ${tenant.id} due to canceled subscription`);
        }
    }

    async getPortalSession(tenantId: string) {
        const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
        if (!tenant || !tenant.stripeCustomerId) {
            throw new NotFoundException('Customer not found in billing system');
        }

        const session = await this.stripe.billingPortal.sessions.create({
            customer: tenant.stripeCustomerId,
            return_url: `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/admin/billing`,
        });

        return { url: session.url };
    }

    // --- PhonePe Integration ---

    async initiatePhonePePayment(tenantId: string, plan: string) {
        const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundException('Tenant not found');

        const transactionId = `TX_${tenantId.substring(0, 8)}_${Date.now()}`;

        // Map plan to price in INR (Example values)
        let amount = 99900; // Starter: ₹999 in paise
        if (plan === 'PRO' || plan === 'GROWTH') amount = 249900;
        if (plan === 'ENTERPRISE') amount = 999900;

        const response = await this.phonePeService.createPayment({
            transactionId,
            merchantUserId: tenantId,
            amount,
            callbackUrl: `${this.configService.get('BACKEND_URL')}/api/subscriptions/phonepe/callback`,
            redirectUrl: `${this.configService.get('FRONTEND_URL')}/admin/billing?provider=phonepe&txId=${transactionId}`,
        });

        if (response.success && response.data.instrumentResponse?.redirectInfo?.url) {
            // Create a pending invoice
            const invoice = this.invoiceRepository.create({
                tenantId,
                amount: amount / 100,
                currency: 'INR',
                status: 'UNPAID',
                provider: 'PHONEPE',
                providerTransactionId: transactionId,
                planName: plan,
            });
            await this.invoiceRepository.save(invoice);

            return { url: response.data.instrumentResponse.redirectInfo.url };
        }

        throw new Error('Failed to initiate PhonePe payment');
    }

    async handlePhonePeCallback(body: any) {
        // PhonePe sends a base64 encoded response
        const base64Response = body.response;
        if (!base64Response) return { success: false };

        const decodedResponse = JSON.parse(Buffer.from(base64Response, 'base64').toString());
        const { success, code, data } = decodedResponse;

        if (success && code === 'PAYMENT_SUCCESS') {
            const transactionId = data.merchantTransactionId;
            const invoice = await this.invoiceRepository.findOne({ where: { providerTransactionId: transactionId } });

            if (invoice && invoice.status !== 'PAID') {
                invoice.status = 'PAID';
                await this.invoiceRepository.save(invoice);

                // Update Tenant Plan
                const tenant = await this.tenantRepository.findOne({ where: { id: invoice.tenantId } });
                if (tenant) {
                    tenant.subscriptionPlan = invoice.planName;
                    tenant.status = 'ACTIVE';

                    // Update quotas automatically
                    const quotas = this.tenantsService.getPlanQuotas(invoice.planName);
                    Object.assign(tenant, quotas);

                    const expiry = new Date();
                    expiry.setMonth(expiry.getMonth() + 1); // 1 month subscription
                    tenant.subscriptionExpiry = expiry;

                    await this.tenantRepository.save(tenant);
                }
            }
        }

        return { success: true };
    }
}
