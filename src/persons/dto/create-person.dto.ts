import { IsEnum, IsOptional, IsString, IsEmail, IsDateString, IsInt } from 'class-validator';

export class CreatePersonDto {
    @IsString()
    tipo_persona: string;
  
    @IsOptional()
    @IsInt()
    cod_cliente?: number;
  
    @IsOptional()
    @IsString()
    nombre?: string;
  
    @IsString()
    num_documento: string;
  
    @IsOptional()
    @IsString()
    representante?: string;
  
    @IsOptional()
    @IsEmail()
    email?: string;
  
    @IsOptional()
    @IsString()
    direccion?: string;
  
    @IsOptional()
    @IsString()
    barrio?: string;
  
    @IsOptional()
    @IsString()
    ciudad?: string;
  
    @IsOptional()
    @IsString()
    alias?: string;
  
    @IsOptional()
    @IsString()
    pais?: string;
  
    @IsOptional()
    @IsString()
    telefono?: string;
  
    @IsInt()
    descuento: number;
  
    @IsOptional()
    @IsInt()
    team?: number;
  
    @IsEnum(['SI', 'NO'])
    cliente_top: 'SI' | 'NO';
  
    @IsOptional()
    @IsInt()
    lista?: number;
  
    @IsEnum(['FABRICANTE', 'DISTRIBUIDOR', 'GRUPO', 'OTRO'])
    tipo: 'FABRICANTE' | 'DISTRIBUIDOR' | 'GRUPO' | 'OTRO';
  
    @IsEnum(['NACIONAL', 'INTERNACIONAL'])
    tipo_venta: 'NACIONAL' | 'INTERNACIONAL';
  
    @IsOptional()
    @IsString()
    nick?: string;
  
    @IsOptional()
    @IsInt()
    nicho_id?: number;
  
    @IsOptional()
    @IsInt()
    linea_venta_id?: number;
  
    @IsOptional()
    @IsInt()
    categorias_lineas_venta_id?: number;
  
    @IsOptional()
    @IsString()
    observacion_nicho?: string;
  
    @IsOptional()
    @IsDateString()
    fecha_registro?: string;
  
    @IsOptional()
    @IsString()
    username_digita?: string;
  
    @IsOptional()
    @IsString()
    departamento?: string;
  
    @IsOptional()
    @IsInt()
    cupo?: number;
  
    @IsOptional()
    @IsString()
    observacion?: string;
  
    
    dias_credito?: string;
  
    @IsOptional()
    @IsString()
    estado?: string;
  
    @IsEnum(['SI', 'NO'])
    vigente: 'SI' | 'NO';
  
    @IsOptional()
    @IsString()
    username_modifica?: string;
}
