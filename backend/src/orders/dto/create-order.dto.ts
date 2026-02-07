export class CreateOrderDto {
  tableName: string;
  customerId?: number;
  items: { menuItemId: number; quantity: number }[];
  discount?: number;
  discountType?: 'FIXED' | 'PERCENT';
}
