import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateDeliveryDto {
    @IsNumber()
    @IsNotEmpty()
    orderId: number;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsOptional()
    driverName?: string;

    @IsString()
    @IsOptional()
    driverPhone?: string;

    @IsNumber()
    @IsOptional()
    deliveryFee?: number;
}
