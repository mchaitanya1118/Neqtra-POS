import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('categories')
  findAll() {
    return this.menuService.findAllCategories();
  }

  @Post('seed')
  seed() {
    return this.menuService.seedDefaults();
  }

  @Post('items/:id/upsell')
  updateUpsell(
    @Param('id') id: string,
    @Body('upsellIds') upsellIds: number[],
  ) {
    return this.menuService.updateMenuItem(+id, upsellIds);
  }

  // --- Category Endpoints ---
  @Post('categories')
  createCategory(@Body() body: any) {
    return this.menuService.createCategory(body);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: any) {
    return this.menuService.updateCategory(+id, body);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.menuService.removeCategory(+id);
  }

  // --- Item Endpoints ---
  @Post('items')
  createItem(@Body() body: any) {
    return this.menuService.createItem(body);
  }

  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() body: any) {
    return this.menuService.updateItem(+id, body);
  }

  @Delete('items/:id')
  removeItem(@Param('id') id: string) {
    return this.menuService.removeItem(+id);
  }
}
