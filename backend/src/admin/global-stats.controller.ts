import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { GlobalStatsService } from './global-stats.service';

@Controller('admin/stats')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class GlobalStatsController {
    constructor(private readonly statsService: GlobalStatsService) { }

    @Get('overview')
    getOverview() {
        return this.statsService.getCoreStats();
    }
}
