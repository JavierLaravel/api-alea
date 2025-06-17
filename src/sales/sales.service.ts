import { Injectable } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { PrismaService } from '../prisma/prisma.service';

import { format, addDays } from 'date-fns';


@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateSaleDto): Promise<{ id: number; wasCreated: boolean }> {
    return await this.prisma.$transaction(async (tx) => {
      const existing = await tx.sales.findFirst({
        where: { observacion: dto.observacion },
        select: { id: true },
      });

      if (existing) {
        return { id: Number(existing.id), wasCreated: false };
      }

      const month = format(new Date(), 'MM');
      const serial = `1${month}`;

      /* const lastSale = await tx.sales.findFirst({
         where: { serial },
         orderBy: { comprobante: 'desc' },
         select: { comprobante: true },
       });*/

      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1); // 1 de enero
      const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1); // 1 de enero del siguiente año

      const lastSale = await tx.sales.findFirst({
        where: {
          serial,
          created_at: {
            gte: startOfYear,
            lt: startOfNextYear,
          },
        },
        orderBy: { comprobante: 'desc' },
        select: { comprobante: true },
      });

      const comprobante = (lastSale?.comprobante ?? 0) + 1;

      const sale = await tx.sales.create({
        data: {
          serial: serial,
          id_persona: dto.id_persona,
          observacion: dto.observacion ?? null,
          type: 1,
          comprobante: comprobante,
          total: dto.total,
          descuento: dto.descuento ?? 0,
          aplicado: dto.aplicado ?? 0,
          grantotal: dto.grantotal,
          fecha_entrega: addDays(new Date(), 15),
          estado: 'PENDIENTE',
          detalle: dto.detalle ?? null,
          formapago: dto.formapago,
          user_id: 1,
          created_at: new Date(),
          username_digita: 'WEB ALEA',
        },
      });

      return { id: Number(sale.id), wasCreated: true };
    });
  }

}
