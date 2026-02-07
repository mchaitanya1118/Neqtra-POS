export class CreateInventoryDto {
  name: string;
  quantity: number;
  unit: string;
  threshold: number;
  supplier?: string;
}
