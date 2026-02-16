export class CreateMenuItemDto {
  title: string;
  price: number;
  categoryId: number;
  imageUrl?: string;
  description?: string;
  isAvailable?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
}
