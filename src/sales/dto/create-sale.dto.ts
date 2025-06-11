import { IsEnum, IsInt, IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { EstadoVenta, FormaPago } from '../enums/sale.enums'; 

export class CreateSaleDto {
  @IsInt()
  id_persona: number;

  @IsString()
  observacion: string;

  @IsInt()
  type: number;

  @IsOptional()
  @IsString()
  serial?: string;

  @IsOptional()
  @IsInt()
  comprobante?: number;

  @IsNumber()
  total: number;

  @IsNumber()
  grantotal: number;

  @IsOptional()
  @IsString()
  detalle?: string;

  @IsOptional()
  @IsDateString()
  f_auto?: string;

  @IsOptional()
  @IsString()
  u_auto?: string;

  @IsOptional()
  @IsDateString()
  f_recha?: string;

  @IsOptional()
  @IsString()
  u_recha?: string;

  @IsEnum(FormaPago)
  formapago: FormaPago;

  @IsOptional()
  @IsString()
  PagoAprobado?: string;

  @IsOptional()
  @IsString()
  cantMinima?: string;

  @IsOptional()
  @IsString()
  ApruebaCant?: string;

  @IsOptional()
  @IsString()
  umin_aprueba?: string;

  @IsOptional()
  @IsDateString()
  umin_fecha?: string;

  @IsOptional()
  @IsString()
  cu_pago?: string;

  @IsOptional()
  @IsDateString()
  cf_pago?: string;

  @IsNumber()
  descuento: number;

  @IsNumber()
  aplicado: number;

  @IsOptional()
  @IsString()
  temp?: string;

  @IsOptional()
  @IsString()
  ApruebaTemp?: string;

  @IsOptional()
  @IsString()
  tu_aprueba?: string;

  @IsOptional()
  @IsDateString()
  tf_aprueba?: string;

  @IsOptional()
  @IsInt()
  num_cierre?: number;

  @IsOptional()
  @IsString()
  user_cierre?: string;

  @IsOptional()
  @IsDateString()
  fecha_cierre?: string;


  @IsOptional()
  @IsString()
  username_modifica?: string;

  @IsString()
  username_digita: string;
}
