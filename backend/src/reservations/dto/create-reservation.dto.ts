export class CreateReservationDto {
  customerName: string;
  contact?: string;
  date: string; // ISO String
  guests: number;
  notes?: string;
}
