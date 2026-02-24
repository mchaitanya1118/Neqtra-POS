import { Controller, Get, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePlan, SubscriptionGuard } from '../auth/subscription.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@RequirePlan('PRO')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Get('sales')
  getSales(@Query() query: { start?: string; end?: string }) {
    return this.reportsService.getSales(query);
  }

  @Get('chart-data')
  getChartData(@Query() query: { start?: string; end?: string }) {
    return this.reportsService.getChartData(query);
  }

  @Get('pnl')
  getPnl(
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.reportsService.getDailyPnL(year, month);
  }
  @Get('items/top')
  getTopItems(
    @Query('limit', ParseIntPipe) limit: number,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.reportsService.getTopSellingItems(limit || 10, start, end);
  }

  @Get('staff/performance')
  getStaffPerformance(
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.reportsService.getStaffPerformance(start, end);
  }
}
