import { PartialType } from '@nestjs/mapped-types';
import { CreateDeliveryDto } from './create-delivery.dto';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateDeliveryDto extends PartialType(CreateDeliveryDto) {
    @IsString()
    @IsOptional()
    @IsEnum(['PENDING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'])
    status?: string;
}
