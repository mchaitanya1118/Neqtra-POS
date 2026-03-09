import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Get('sales/excel')
  async getSalesExcel(
    @Query('start') start: string,
    @Query('end') end: string,
    @Res() res: Response,
  ) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return this.reportsService.generateSalesReport(startDate, endDate, res);
  }

  @Get('inventory/pdf')
  async getInventoryPdf(@Res() res: Response) {
    return this.reportsService.generateInventoryPdf(res);
  }

  @Get('pnl')
  async getPnlData(@Query('year') year: string, @Query('month') month: string) {
    // Stub implementation to fix 404 on frontend PnLCalendar
    return [];
  }
}
