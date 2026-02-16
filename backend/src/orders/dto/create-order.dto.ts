import { IsString, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OmitType } from '@nestjs/mapped-types';
import { CreateDeliveryDto } from '../../delivery/dto/create-delivery.dto';


export class CreateDeliveryDetailsDto extends OmitType(CreateDeliveryDto, ['orderId'] as const) { }

export class CreateOrderDto {
  @IsString()
  @IsOptional()
  tableName: string;

  @IsString()
  @IsOptional()
  @IsEnum(['DINE_IN', 'DELIVERY', 'PICK_UP'])
  type?: string;

  @IsNumber()
  @IsOptional()
  customerId?: number;

  @IsArray()
  items: { menuItemId: number; quantity: number }[];

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsString()
  @IsOptional()
  @IsEnum(['FIXED', 'PERCENT'])
  discountType?: 'FIXED' | 'PERCENT';

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDeliveryDetailsDto)
  deliveryDetails?: CreateDeliveryDetailsDto;
}


