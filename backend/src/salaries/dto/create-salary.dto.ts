import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateSalaryDto {
    @IsNumber()
    @IsNotEmpty()
    userId: number;

    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @IsDateString()
    @IsNotEmpty()
    paymentDate: string;

    @IsString()
    @IsNotEmpty()
    paymentMonth: string;

    @IsString()
    @IsNotEmpty()
    paymentMethod: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsString()
    @IsOptional()
    referenceNote?: string;
}
