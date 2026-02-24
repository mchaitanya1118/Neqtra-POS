import { Controller, Patch, Body, UseGuards, Request, Logger, Get, Param, NotFoundException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tenants')
export class TenantsController {
    private readonly logger = new Logger(TenantsController.name);

    constructor(private readonly tenantsService: TenantsService) { }

    @Get('lookup/:subdomain')
    async lookup(@Param('subdomain') subdomain: string) {
        if (!subdomain) {
            throw new NotFoundException('Subdomain not provided');
        }

        try {
            // Service method to be implemented next
            const tenant = await this.tenantsService.findBySubdomain(subdomain);
            if (!tenant) {
                throw new NotFoundException('Tenant not found');
            }
            // Expose ONLY safe details needed for the login page
            return {
                id: tenant.id,
                name: tenant.name,
                hasPasscode: true, // You can make this dynamic later if desired
            };
        } catch (error) {
            throw new NotFoundException('Tenant not found');
        }
    }

    @UseGuards(JwtAuthGuard)
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
