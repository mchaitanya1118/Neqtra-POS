import { Controller, Post, Body, Req, Res, Headers, RawBodyRequest, UseGuards, Request, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) { }

    @UseGuards(JwtAuthGuard)
    @Post('create-checkout-session')
    async createCheckoutSession(@Body('priceId') priceId: string, @Request() req) {
        const tenantId = req.user.tenantId;
        return this.subscriptionsService.createCheckoutSession(tenantId, priceId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('quota')
    async getQuota(@Request() req) {
        return this.subscriptionsService.getQuotaUsage(req.user.tenantId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('portal-session')
    async createPortalSession(@Request() req) {
        const tenantId = req.user.tenantId;
        return this.subscriptionsService.getPortalSession(tenantId);
    }

    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(@Headers('stripe-signature') signature: string, @Req() req: any) {
        // Stripe requires the raw body to verify the signature
        await this.subscriptionsService.handleWebhook(signature, req.rawBody as Buffer);
        return { received: true };
    }

    @UseGuards(JwtAuthGuard)
    @Post('phonepe/initiate')
    async initiatePhonePe(@Body('plan') plan: string, @Request() req) {
        const tenantId = req.user.tenantId;
        return this.subscriptionsService.initiatePhonePePayment(tenantId, plan);
    }

    @Post('phonepe/callback')
    @HttpCode(HttpStatus.OK)
    async phonePeCallback(@Body() body: any) {
        return this.subscriptionsService.handlePhonePeCallback(body);
    }
}
