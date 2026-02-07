import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(+id, updateCustomerDto);
  }

  @Patch(':id/settle')
  settleDue(@Param('id') id: string, @Body('amount') amount: number) {
    return this.customersService.settleDue(+id, amount);
  }

  @Patch(':id/add-due')
  addDue(@Param('id') id: string, @Body('amount') amount: number) {
    return this.customersService.addDue(+id, amount);
  }

  @Get('report/dues')
  getDuesReport() {
    return this.customersService.getDuesReport();
  }

  @Get('report/transactions')
  getDuesTransactions() {
    return this.customersService.getDuesTransactions();
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.customersService.getHistory(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(+id);
  }
}
