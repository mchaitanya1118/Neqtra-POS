import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateDeviceDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    identifier: string; // The unique hardware/browser fingerprint or UUID

    @IsUUID()
    @IsOptional()
    branchId?: string;
}
