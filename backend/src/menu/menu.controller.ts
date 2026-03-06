import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MenuService } from './menu.service';
import { AiMenuService } from './ai-menu.service';
import { RedisCacheInterceptor, CacheTTL } from '../common/interceptors/redis-cache.interceptor';

@Controller('menu')
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly aiMenuService: AiMenuService,
  ) { }

  @Get('categories')
  @UseInterceptors(RedisCacheInterceptor)
  @CacheTTL(300) // Cache for 5 minutes
  findAll() {
    return this.menuService.findAllCategories();
  }

  @Post('ai-extract')
  @UseInterceptors(FileInterceptor('file'))
  async extractMenu(@UploadedFile() file: Express.Multer.File) {
    return this.aiMenuService.extractMenuFromImage(file.buffer, file.mimetype);
  }

  @Post('ai-import')
  @UseInterceptors(FileInterceptor('file'))
  async importMenu(@UploadedFile() file: Express.Multer.File) {
    return this.aiMenuService.extractAndImportMenu(file.buffer, file.mimetype);
  }

  @Get('items')
  @UseInterceptors(RedisCacheInterceptor)
  @CacheTTL(300) // Cache for 5 minutes
  findAllItems(@Query('categoryId') categoryId?: string) {
    return this.menuService.findAllItems(categoryId ? +categoryId : undefined);
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
