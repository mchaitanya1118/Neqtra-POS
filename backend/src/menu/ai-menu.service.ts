import { Injectable, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { MenuItem } from '../entities/menu-item.entity';
import Groq from 'groq-sdk';

@Injectable({ scope: Scope.REQUEST })
export class AiMenuService {
  private groq: Groq;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(MenuItem)
    private menuItemRepo: Repository<MenuItem>,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (apiKey) {
      this.groq = new Groq({ apiKey });
    }
  }

  async extractMenuFromImage(fileBuffer: Buffer, mimetype: string) {
    if (!this.groq) {
      throw new Error('Groq API key not configured');
    }

    const base64Image = fileBuffer.toString('base64');
    const dataUrl = `data:${mimetype};base64,${base64Image}`;

    const prompt = `Extract the menu items from this image and return ONLY a valid JSON object (no markdown, no code blocks) with this structure:
{
  "categories": [
    {
      "title": "Category Name",
      "items": [
        {
          "title": "Item Name",
          "price": 12.50,
          "description": "Short description if available"
        }
      ]
    }
  ]
}
Rules:
1. Group items by their headings/categories in the menu.
2. Prices should be numeric. If a range is given, use the lower price.
3. If no category is clear, use "Uncategorized".
4. Capitalize item and category names properly (e.g. "Chicken Burger" not "CHICKEN BURGER").
5. Return ONLY valid JSON, no explanation, no markdown.`;

    const response = await this.groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    });

    const text = response.choices[0]?.message?.content || '';
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(jsonStr);
      console.log('AI Extraction PARSED Successfully');
      return parsed;
    } catch (e) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Failed to extract structured data from menu image');
    }
  }

  /**
   * Full pipeline: extract from image AND save all categories/items to DB.
   * Skips duplicate categories (case-insensitive) and duplicate items within categories.
   * Returns a summary of what was added.
   */
  async extractAndImportMenu(fileBuffer: Buffer, mimetype: string) {
    const extracted = await this.extractMenuFromImage(fileBuffer, mimetype);

    const summary = {
      categoriesAdded: 0,
      itemsAdded: 0,
      itemsSkipped: 0,
    };

    // Fetch all existing categories for this tenant in one query
    const existingCategories = await this.categoryRepo.find({
      relations: ['items'],
    });

    for (const catData of extracted.categories) {
      const normalizedCatTitle = catData.title.trim();

      // Case-insensitive match for existing category
      let category = existingCategories.find(
        (c) => c.title.toLowerCase() === normalizedCatTitle.toLowerCase(),
      );

      if (!category) {
        category = this.categoryRepo.create({
          title: normalizedCatTitle,
          icon: 'Utensils',
          variant: 'orange',
          items: [],
        });
        category = await this.categoryRepo.save(category);
        summary.categoriesAdded++;
        // Add to our local list so further iterations can see it
        existingCategories.push(category);
      }

      // Build set of existing item titles (lowercase) for fast lookup
      const existingItemTitles = new Set(
        (category.items || []).map((i) => i.title.toLowerCase()),
      );

      for (const itemData of catData.items) {
        const title = itemData.title?.trim();
        if (!title) continue;

        if (existingItemTitles.has(title.toLowerCase())) {
          summary.itemsSkipped++;
          continue;
        }

        const newItem = this.menuItemRepo.create({
          title,
          price: Number(itemData.price) || 0,
          description: itemData.description || '',
          isAvailable: true,
          category,
        });
        await this.menuItemRepo.save(newItem);
        existingItemTitles.add(title.toLowerCase());
        summary.itemsAdded++;
      }
    }

    console.log('AI Import Summary:', summary);
    return {
      success: true,
      summary,
      categories: extracted.categories.length,
    };
  }
}
