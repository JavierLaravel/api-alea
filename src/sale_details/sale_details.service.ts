import { Injectable } from '@nestjs/common';
import { CreateSaleDetailDto } from './dto/create-sale_detail.dto';
import { UpdateSaleDetailDto } from './dto/update-sale_detail.dto';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class SaleDetailsService {

  constructor(private prisma: PrismaService) { }

  async create(dto: CreateSaleDetailDto) {
    return await this.prisma.sale_details.create({
      data: {
        precio: dto.precio,
        cantidad: dto.cantidad,
        id_presentation: dto.id_presentation,
        id_producto: dto.id_producto,
        nota: null,
        estado: 'PENDIENTE',
        sale_id: dto.sale_id,
        username_digita: 'USER_WEB',
        muestras: 'NO',
        valor_molde: 0,
        despachado: 0,
        detalleRechaza: null,
        info:null,
        existe: 'NO',
        'created_at': new Date(),
      },
    });
  }

}
