export class CreateExpenseDto {
  description: string;
  amount: number;
  category: string;
  date: string; // ISO Date
}
