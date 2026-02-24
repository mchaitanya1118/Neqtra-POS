import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { Tenant } from '../tenants/entities/tenant.entity';
import { BranchesService } from '../branches/branches.service';
import { DevicesService } from '../devices/devices.service';

@Injectable()
export class SubscriptionsService {
    private stripe: Stripe;
    private readonly logger = new Logger(SubscriptionsService.name);

    constructor(
        @InjectRepository(Tenant)
        private tenantRepository: Repository<Tenant>,
        private configService: ConfigService,
        private branchesService: BranchesService,
        private devicesService: DevicesService,
    ) {
        const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_placeholder';
        this.stripe = new Stripe(stripeKey, {});
    }

    async getQuotaUsage(tenantId: string) {
        const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundException('Tenant not found');

        const activeBranches = await this.branchesService.countActive(tenantId);
        const activeDevices = await this.devicesService.countActive(tenantId);

        let maxBranches = 1;
        let maxDevices = Infinity;

        switch (tenant.subscriptionPlan?.toUpperCase()) {
            case 'FREE':
            case 'STARTER':
            case 'TRIAL':
                maxBranches = 1;
                maxDevices = 2;
                break;
            case 'PRO':
                maxBranches = 3;
                maxDevices = Infinity;
                break;
            case 'ENTERPRISE':
                maxBranches = Infinity;
                maxDevices = Infinity;
                break;
        }

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
}
