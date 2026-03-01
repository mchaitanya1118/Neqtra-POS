import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminAuditService } from './admin-audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly auditService: AdminAuditService,
    ) { }

    @Post('tenants')
    createTenant(@Body() body: { name: string; plan?: string }, @Req() req: any) {
        return this.adminService.createTenant(body.name, body.plan, req.user);
    }

    @Get('tenants')
    getTenants() {
        return this.adminService.findAll();
    }

    @Patch('tenants/:id/plan')
    updateSubscription(@Param('id') id: string, @Body() body: { plan: string }, @Req() req: any) {
        return this.adminService.updateSubscription(id, body.plan, req.user);
    }

    @Patch('tenants/:id/quotas')
    updateQuotas(@Param('id') id: string, @Body() quotas: { maxUsers?: number; maxTables?: number }, @Req() req: any) {
        return this.adminService.updateQuotas(id, quotas, req.user);
    }

    @Patch('tenants/:id/status')
    toggleStatus(@Param('id') id: string, @Req() req: any) {
        return this.adminService.toggleStatus(id, req.user);
    }

    @Delete('tenants/:id')
    deleteTenant(@Param('id') id: string, @Req() req: any) {
        return this.adminService.deleteTenant(id, req.user);
    }

    @Get('audit-logs')
    getAuditLogs() {
        return this.auditService.getLogs();
    }
}
