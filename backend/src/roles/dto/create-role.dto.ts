import { IsString, IsNotEmpty, IsArray, IsBoolean, IsOptional } from 'class-validator';

export class CreateRoleDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsArray()
    @IsString({ each: true })
    permissions: string[];

    @IsBoolean()
    @IsOptional()
    isSystem?: boolean;
}
