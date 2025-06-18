import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

@Injectable()
export class PersonsService {

  constructor(private prisma: PrismaService) {}
  
  async checkOrCreate(dto: CreatePersonDto): Promise<{ id: number }> {
    const existing = await this.prisma.personas.findFirst({
      where: { num_documento: dto.num_documento },
      select: { id: true },
    });

    const ciudad = dto.ciudad?.toUpperCase() ?? null;
    const departamento = dto.departamento?.toUpperCase() ?? null;
    const pais = dto.pais?.toUpperCase() ?? null;
    const direccion = dto.direccion?.toUpperCase() ?? null;
    const nombre = dto.nombre?.toUpperCase() ?? null;
    const representante = dto.representante?.toUpperCase() ?? null;
    const observacion = dto.observacion?.toUpperCase() ?? null;
  
    if (existing) {

      await this.prisma.personas.update({
        where: { id: existing.id },
        data: {
          direccion,
          email: dto.email ?? null,
          ciudad,
          departamento,
          pais,
          telefono: dto.telefono ?? null,
          observacion,
          tipo_venta: dto.tipo_venta,

        },
      });
      
      return { id: existing.id };
    }
  
    const created = await this.prisma.$transaction(async (tx) => {
      const last = await tx.personas.findFirst({
        orderBy: { cod_cliente: 'desc' },
        where: { cod_cliente: { not: null } },
        select: { cod_cliente: true },
      });
  
      const cod_cliente = dto.cod_cliente ?? (last?.cod_cliente ?? 0) + 1;
  
      const persona = await tx.personas.create({
        data: {
          tipo_persona: dto.tipo_persona,
          cod_cliente,
          nombre,
          num_documento: dto.num_documento,
          representante,
          email: dto.email ?? null,
          direccion,
          ciudad,
          pais,
          telefono: dto.telefono ?? null,
          descuento: dto.descuento ?? 0,
          team: dto.team ?? 10,
          cliente_top: dto.cliente_top ?? 'NO',
          lista: dto.lista ?? 3,
          tipo: dto.tipo ?? 'OTRO',
          tipo_venta: dto.tipo_venta,
          fecha_registro: new Date(),
          username_digita: dto.username_digita ?? 'WEB ALEA',
          departamento: dto.departamento ?? null,
          cupo: dto.cupo ?? 0,
          observacion,
          estado: dto.estado ?? 'DESHABILITADO',
          vigente: dto.vigente ?? 'SI',
          username_modifica: dto.username_modifica ?? null,
        },
      });
  
      return persona;
    });
  
    return { id: created.id };
  }
  
}
