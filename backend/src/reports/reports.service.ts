import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { InventoryItem } from '../inventory/entities/inventory.entity';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

const PdfPrinter = require('pdfmake');

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(InventoryItem)
    private inventoryRepo: Repository<InventoryItem>,
  ) { }

  async generateSalesReport(startDate: Date, endDate: Date, res: Response) {
    const orders = await this.orderRepo.find({
      where: {
        createdAt: Between(startDate, endDate),
        status: 'COMPLETED',
      },
      relations: ['items', 'items.menuItem'],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sales Report');

    sheet.columns = [
      { header: 'Order ID', key: 'id', width: 10 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Items', key: 'items', width: 30 },
      { header: 'Total Amount', key: 'total', width: 15 },
    ];

    orders.forEach((order) => {
      const itemsStr = order.items
        .map((i) => `${i.menuItem.title} (x${i.quantity})`)
        .join(', ');
      sheet.addRow({
        id: order.id,
        date: order.createdAt.toLocaleString(),
        items: itemsStr,
        total: order.totalAmount,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'sales_report.xlsx',
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  async generateInventoryPdf(res: Response) {
    const items = await this.inventoryRepo.find();

    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };

    const printer = new PdfPrinter(fonts);

    const docDefinition = {
      content: [
        { text: 'Inventory Stock Report', style: 'header' },
        { text: `Generated on: ${new Date().toLocaleString()}`, margin: [0, 0, 0, 20] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              ['Item Name', 'Current Stock', 'Unit', 'Status'],
              ...items.map((item) => [
                item.name,
                item.quantity,
                item.unit,
                item.quantity <= item.threshold ? 'LOW STOCK' : 'OK',
              ]),
            ],
          },
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory.pdf');
    pdfDoc.pipe(res);
    pdfDoc.end();
  }
}
