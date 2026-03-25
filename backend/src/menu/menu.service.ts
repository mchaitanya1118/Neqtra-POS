import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { ClsService } from 'nestjs-cls';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(MenuItem)
    private menuItemRepo: Repository<MenuItem>,
    private readonly redis: RedisService,
    private readonly cls: ClsService,
  ) { }

  private async getCacheKey(suffix: string) {
    const tenantId = this.cls.get('tenantId');
    return `tenant:${tenantId}:menu:${suffix}`;
  }

  private async invalidateCache() {
    const client = this.redis.getOrThrow();
    const key = await this.getCacheKey('categories');
    await client.del(key);
  }

  async findAllCategories() {
    const client = this.redis.getOrThrow();
    const key = await this.getCacheKey('categories');

    // Try cache
    const cached = await client.get(key);
    if (cached) return JSON.parse(cached);

    // Fetch and cache
    const categories = await this.categoryRepo.find({
      relations: ['items', 'items.upsellItems'],
    });

    await client.set(key, JSON.stringify(categories), 'EX', 3600); // 1 hour cache
    return categories;
  }

  async findAllItems(categoryId?: number) {
    if (categoryId) {
      return this.menuItemRepo.find({
        where: { category: { id: categoryId } },
        relations: ['category', 'upsellItems'],
      });
    }
    return this.menuItemRepo.find({
      relations: ['category', 'upsellItems'],
    });
  }

  async seedDefaults() {
    // Only seed if empty
    const count = await this.categoryRepo.count();
    // if (count > 0) return { message: 'Already seeded' }; // Commented out to allow forced re-seeding if needed, or check externally

    // Define Menu Data
    const categoriesData = [
      {
        title: 'Soup',
        icon: 'Soup',
        variant: 'orange',
        items: [
          { title: 'Manchow Soup (Veg)', price: 150 },
          { title: 'Manchow Soup (Non-Veg)', price: 200 },
          { title: 'Hot & Sour Soup (Veg)', price: 150 },
          { title: 'Hot & Sour Soup (Non-Veg)', price: 200 },
          { title: 'Sweet Corn Soup (Veg)', price: 150 },
          { title: 'Sweet Corn Soup (Non-Veg)', price: 200 },
        ],
      },
      {
        title: 'Veg Starters',
        icon: 'Salad',
        variant: 'green',
        items: [
          { title: 'Veg Manchuria', price: 300 },
          { title: 'Chilli Baby Corn', price: 300 },
          { title: 'Chilli Mushroom', price: 300 },
          { title: 'Mushroom 65', price: 300 },
          { title: 'Pepper Paneer', price: 300 },
          { title: 'Dragon Paneer', price: 300 },
          { title: 'Paneer Majestic', price: 300 },
          { title: 'Paneer 555', price: 300 },
          { title: 'Gobi Manchuria', price: 300 },
          { title: 'Paneer Manchuria', price: 300 },
          { title: 'Paneer 65', price: 300 },
          { title: 'Chilli Paneer', price: 300 },
          { title: 'Crispy Corn', price: 300 },
          { title: 'Crispy Fried Baby Corn', price: 300 },
          { title: 'Veg Salt and Pepper', price: 300 },
          { title: 'Honey Chilli Potato', price: 300 },
        ],
      },
      {
        title: 'Non Veg Starters',
        icon: 'Drumstick',
        variant: 'red',
        items: [
          { title: 'Chilli Chicken', price: 350 },
          { title: 'Chicken 65', price: 350 },
          { title: 'Chicken Manchuria', price: 350 },
          { title: 'Chicken Drumstick (6)', price: 350 },
          { title: 'Chicken Lollipop', price: 350 },
          { title: 'Chicken 555', price: 350 },
          { title: 'Chicken Wings', price: 350 },
          { title: 'Pepper Chicken', price: 350 },
          { title: 'Fish & Chips', price: 350 },
          { title: 'Chilli Fish', price: 350 },
          { title: 'Apollo Fish', price: 350 },
          { title: 'Loose Prawns', price: 350 },
          { title: 'Chilli Prawns', price: 350 },
          { title: 'Dragon Chicken', price: 350 },
          { title: 'Chicken Majestic', price: 350 },
          { title: 'Butter Garlic Chicken', price: 350 },
          { title: 'Basil Lemon Chicken', price: 350 },
          { title: 'Tai Pai Chicken', price: 350 },
          { title: 'Black Pepper Chicken', price: 350 },
          { title: 'Teriyaki Chicken', price: 350 },
          { title: 'BBQ Chicken', price: 350 },
          { title: 'Chicken Salt & Pepper', price: 350 },
          { title: 'Chicken Hong Kong', price: 350 },
          { title: 'Bangkok Chicken', price: 350 },
          { title: 'Schezwan Chicken', price: 350 },
        ],
      },
      {
        title: 'Extra',
        icon: 'PlusCircle',
        variant: 'gray',
        items: [
          { title: 'Parotta', price: 50 },
          { title: 'Curd / Raita', price: 50 },
          { title: 'Mayonnaise', price: 50 },
          { title: 'Onion Salad', price: 50 },
        ],
      },
      {
        title: 'Main Course',
        icon: 'Utensils',
        variant: 'orange',
        items: [
          { title: 'Jeera Rice / Curd Rice', price: 200 },
          { title: 'Soft Fried Rice (Veg)', price: 250 },
          { title: 'Soft Fried Rice (Non-Veg)', price: 300 },
          { title: 'Soft Noodles (Veg)', price: 250 },
          { title: 'Soft Noodles (Non-Veg)', price: 300 },
          { title: 'Chilli Garlic Rice (Veg)', price: 250 },
          { title: 'Chilli Garlic Rice (Non-Veg)', price: 300 },
          { title: 'Chilli Garlic Noodles (Veg)', price: 250 },
          { title: 'Chilli Garlic Noodles (Non-Veg)', price: 300 },
          { title: 'Schezwan Rice (Veg)', price: 250 },
          { title: 'Schezwan Rice (Non-Veg)', price: 300 },
          { title: 'Schezwan Noodles (Veg)', price: 250 },
          { title: 'Schezwan Noodles (Non-Veg)', price: 300 },
          { title: 'Double Egg Rice', price: 300 },
          { title: 'Double Egg Noodles', price: 300 },
        ],
      },
      {
        title: 'Special Main Course',
        icon: 'Star',
        variant: 'yellow',
        items: [
          { title: 'Chicken Butter Garlic Fried Rice', price: 400 },
          { title: 'Butter Rice with Grilled Chicken', price: 400 },
          { title: 'Butter Rice with Grilled Fish', price: 400 },
          { title: 'Butter Chicken with Jeera Rice', price: 400 },
          { title: 'Chicken Kheema with Jeera Rice', price: 400 },
          { title: 'Paneer Butter Masala with Jeera Rice', price: 400 },
          { title: 'Parotta with Any Curry / Starter', price: 400 },
          { title: 'Parotta with Chicken Kheema', price: 400 },
        ],
      },
      {
        title: 'Beverages',
        icon: 'CupSoda',
        variant: 'blue',
        items: [
          { title: 'Water Bottle (500ml)', price: 30 },
          { title: 'Soft Drink Can (300ml)', price: 100 },
          { title: 'Diet Coke', price: 100 },
          { title: 'Pulpy Orange', price: 100 },
          { title: 'Hell', price: 100 },
          { title: 'Redbull', price: 200 },
        ],
      },
      {
        title: 'Tea / Coffee',
        icon: 'Coffee',
        variant: 'brown',
        items: [
          { title: 'Home Style Tea', price: 100 },
          { title: 'Masala Tea', price: 100 },
          { title: 'Ginger Tea', price: 100 },
          { title: 'Green Tea', price: 100 },
          { title: 'Bru Coffee', price: 100 },
          { title: 'Black Coffee', price: 100 },
        ],
      },
      {
        title: 'Milkshakes',
        icon: 'IceCream',
        variant: 'pink',
        items: [
          { title: 'Vanilla Milkshake', price: 200 },
          { title: 'Strawberry Milkshake', price: 200 },
          { title: 'Black Currant Milkshake', price: 200 },
          { title: 'Chocolate Milkshake', price: 200 },
          { title: 'Kitkat Milkshake', price: 200 },
          { title: 'Oreo Cookie Milkshake', price: 200 },
          { title: 'Snickers Milkshake', price: 200 },
          { title: 'Ferrero Rocher Milkshake', price: 250 },
        ],
      },
      {
        title: 'Maggie',
        icon: 'UtensilsCrossed',
        variant: 'yellow',
        items: [
          { title: 'Veg Cheese Maggie', price: 150 },
          { title: 'Masala Cheese Maggie', price: 150 },
          { title: 'Egg Cheese Maggie', price: 150 },
          { title: 'Chicken Cheese Maggie', price: 150 },
        ],
      },
      {
        title: 'Sandwich',
        icon: 'Sandwich',
        variant: 'orange',
        items: [
          { title: 'Veg Sandwich', price: 250 },
          { title: 'Paneer Sandwich', price: 250 },
          { title: 'Paneer 65 Sandwich', price: 250 },
          { title: 'Double Egg Sandwich', price: 250 },
          { title: 'Chicken Sandwich', price: 250 },
          { title: 'Chicken 65 Sandwich', price: 250 },
          { title: 'Nutella Sandwich', price: 250 },
          { title: 'Peanut Butter Sandwich', price: 250 },
        ],
      },
      {
        title: 'Mocktail',
        icon: 'Martini',
        variant: 'blue',
        items: [
          { title: 'Pomegranate Delight', price: 150 },
          { title: 'Blue Curacao Angle', price: 150 },
          { title: 'Virgin Mojito', price: 150 },
          { title: 'Watermelon Mocktail', price: 150 },
          { title: 'Green Apple Mocktail', price: 150 },
          { title: 'Blue Berry Tea', price: 150 },
          { title: 'Peach Passion Tea', price: 150 },
          { title: 'Black Berry Tea', price: 150 },
          { title: 'Lemon Ice Tea', price: 150 },
          { title: 'Fresh Lime Soda (Sweet & Salt)', price: 150 },
        ],
      },
      {
        title: 'Quick Bites',
        icon: 'Cookie',
        variant: 'orange',
        items: [
          { title: 'Salted French Fries', price: 200 },
          { title: 'Peri Peri French Fries', price: 200 },
          { title: 'Chicken Nuggets', price: 200 },
          { title: 'Chicken Popcorn', price: 200 },
          { title: 'Chilli Cheese Toast', price: 200 },
          { title: 'Cheese Garlic Bread', price: 200 },
        ],
      },
      {
        title: 'Pasta',
        icon: 'Pizza',
        variant: 'red',
        items: [
          { title: 'Arrabiata Red Sauce Pasta (Veg)', price: 350 },
          { title: 'Arrabiata Red Sauce Pasta (Non-Veg)', price: 350 },
          { title: 'Creamy White Sauce Pasta (Veg)', price: 350 },
          { title: 'Creamy White Sauce Pasta (Non-Veg)', price: 350 },
          { title: 'Basil Red Sauce Pasta (Veg)', price: 350 },
          { title: 'Basil Red Sauce Pasta (Non-Veg)', price: 350 },
          { title: 'Mixed Sauce Pasta (Veg)', price: 350 },
          { title: 'Mixed Sauce Pasta (Non-Veg)', price: 350 },
        ],
      },
      {
        title: 'Diet',
        icon: 'Carrot',
        variant: 'green',
        items: [
          { title: 'Boiled English Vegetables', price: 300 },
          { title: 'Boiled Eggs with Boiled Vegetables', price: 300 },
          { title: 'Grilled Fish with Boiled Vegetables', price: 350 },
          { title: 'Grilled Chicken with Boiled Vegetables', price: 350 },
        ],
      },
      {
        title: 'Salad',
        icon: 'LeafyGreen',
        variant: 'green',
        items: [
          { title: 'Cucumber Yogurt Salad (Veg)', price: 250 },
          { title: 'Italian Pasta Salad (Veg)', price: 300 },
          { title: 'Italian Pasta Salad (Non-Veg)', price: 350 },
          { title: 'Caesar Salad (Veg)', price: 300 },
          { title: 'Caesar Salad (Non-Veg)', price: 350 },
        ],
      },
    ];

    for (const catData of categoriesData) {
      // Check if category exists
      let category = await this.categoryRepo.findOneBy({
        title: catData.title,
      });

      if (!category) {
        category = this.categoryRepo.create({
          title: catData.title,
          icon: catData.icon,
          variant: catData.variant,
          items: [],
        });
        // We'll save it first to get an ID if needed, but cascade works too.
        // Let's create items
        category.items = catData.items.map((item) =>
          this.menuItemRepo.create(item),
        );
        await this.categoryRepo.save(category);
      } else {
        // If Category exists, maybe add missing items? For now, we skip or could update.
        // Proactive: Avoid duplicates if re-seeding
        // console.log(`Category ${catData.title} already exists`);
      }
    }

    return {
      message: 'Menu Seeded successfully',
      categoriesCount: categoriesData.length,
    };
  }

  // --- Category CRUD ---
  async createCategory(createCategoryDto: any) {
    const res = await this.categoryRepo.save(createCategoryDto);
    await this.invalidateCache();
    return res;
  }

  async updateCategory(id: number, updateCategoryDto: any) {
    const res = await this.categoryRepo.update(id, updateCategoryDto);
    await this.invalidateCache();
    return res;
  }

  async removeCategory(id: number) {
    // Soft delete items first
    await this.menuItemRepo.softDelete({ category: { id } });
    // Soft delete category
    const res = await this.categoryRepo.softDelete(id);
    await this.invalidateCache();
    return res;
  }

  // --- MenuItem CRUD ---
  async createItem(createMenuItemDto: any) {
    const category = await this.categoryRepo.findOneBy({
      id: createMenuItemDto.categoryId,
    });
    if (!category) throw new Error('Category not found');

    const item = this.menuItemRepo.create({
      ...createMenuItemDto,
      category,
    });
    const res = await this.menuItemRepo.save(item);
    await this.invalidateCache();
    return res;
  }

  async updateItem(id: number, updateMenuItemDto: any) {
    const res = await this.menuItemRepo.update(id, updateMenuItemDto);
    await this.invalidateCache();
    return res;
  }

  async removeItem(id: number) {
    const res = await this.menuItemRepo.softDelete(id);
    await this.invalidateCache();
    return res;
  }

  async updateMenuItem(id: number, upsellItemIds: number[]) {
    const item = await this.menuItemRepo.findOne({
      where: { id },
      relations: ['upsellItems'],
    });

    if (!item) throw new Error('Item not found');

    if (upsellItemIds && upsellItemIds.length > 0) {
      const upsells = await this.menuItemRepo.findByIds(upsellItemIds);
      item.upsellItems = upsells;
    } else {
      item.upsellItems = [];
    }

    return this.menuItemRepo.save(item);
  }

  async updateItemImage(id: number, file: Express.Multer.File) {
    const tenantId = this.cls.get('tenantId');
    const item = await this.menuItemRepo.findOneBy({ id });
    if (!item) throw new Error('Item not found');

    const uploadDir = path.join(process.cwd(), 'uploads', 'menu-items', tenantId || 'default');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${id}_${Date.now()}${path.extname(file.originalname)}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, file.buffer);

    const imageUrl = `/uploads/menu-items/${tenantId || 'default'}/${filename}`;
    item.imageUrl = imageUrl;
    
    await this.menuItemRepo.save(item);
    await this.invalidateCache();

    return { imageUrl };
  }
}
