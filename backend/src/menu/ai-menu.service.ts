import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiMenuService {
    private genAI: GoogleGenerativeAI;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
    }

    async extractMenuFromImage(fileBuffer: Buffer, mimetype: string) {
        if (!this.genAI) {
            throw new Error('Gemini API key not configured');
        }

        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
      Extract the menu items from this image and return a JSON object with the following structure:
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
      4. Ensure the response is valid JSON only.
    `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: fileBuffer.toString('base64'),
                    mimeType: mimetype,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean JSON response (remove markdown blocks if present)
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error('Failed to parse AI response:', text);
            throw new Error('Failed to extract structured data from menu image');
        }
    }
}
