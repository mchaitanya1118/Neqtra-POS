import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  getSales(@Query() query: { start?: string; end?: string }) {
    return this.reportsService.getSales(query);
  }

  @Get('pnl')
  getPnl(
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.reportsService.getDailyPnL(year, month);
  }
}
