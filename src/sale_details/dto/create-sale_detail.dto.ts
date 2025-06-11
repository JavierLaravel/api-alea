import {
    IsOptional,
    IsString,
    IsNumber,
    IsEnum,
    IsDateString,
  } from 'class-validator';
  
  export class CreateSaleDetailDto {
    @IsNumber()
    precio: number;
  
    @IsNumber()
    cantidad: number;
  
    @IsNumber()
    id_presentation: number;
  
    @IsNumber()
    id_producto: number;
  
    @IsOptional()
    @IsString()
    nota: string;
  
  
    @IsNumber()
    sale_id: number;
  
    @IsOptional()
    @IsString()
    username_digita: string;
  
    @IsOptional()
    @IsString()
    u_estado: string;
  
  
    @IsOptional()
    @IsString()
    detalleRechaza: string;
  
    @IsOptional()
    @IsString()
    info: string;

  }
  