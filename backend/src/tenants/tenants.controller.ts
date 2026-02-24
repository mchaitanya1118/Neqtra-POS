import { Controller, Patch, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
    private readonly logger = new Logger(TenantsController.name);

    constructor(private readonly tenantsService: TenantsService) { }

    @Patch('profile')
    async updateProfile(@Request() req, @Body() updateData: any) {
        const tenantId = req.user.tenantId;
        this.logger.log(`Updating profile for tenant: ${tenantId}`);

        // Only allow updating specific profile fields to prevent privilege escalation
        const allowedUpdates = {
            name: updateData.name,
            email: updateData.email,
            phone: updateData.phone,
            currency: updateData.currency,
            taxRate: updateData.taxRate,
        };

        // Remove undefined fields
        Object.keys(allowedUpdates).forEach(key => {
            if (allowedUpdates[key] === undefined) {
                delete allowedUpdates[key];
            }
        });

        return this.tenantsService.updateProfile(tenantId, allowedUpdates);
    }
}
