import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class ProductionLineService {

  constructor(private prisma: PrismaService) { }


  async findAll() {
    // Obtenemos todos los insumos
    const productionLine = await this.prisma.lineas.findMany({
      select: {
        id: true,
        nombre: true,
        slug: true,
      },
    });
  
    // Para cada insumo, contamos los productos relacionados que cumplen con las condiciones
    const productionLineCount = await Promise.all(
      productionLine.map(async (pline) => {
        const count = await this.prisma.products.count({
          where: {
            linea_id: pline.id, // Filtramos por el insumo actual
            estado: 'ACTIVO', // Solo productos activos
            proceso: 'COMPLETO', // Solo productos completos
            is_web: 'SI', // Solo productos disponibles en la web
          },
        });
  
        return {
          ...pline,
          cantidad: count, // Agregamos el conteo al objeto del insumo
        };
      }),
    );
  
    return productionLineCount;
  }

  async findBySlug(slug: string) {
    try {
      const productionLine = await this.prisma.lineas.findFirst({
        where: {
          slug: slug,
        },
        select: {
          id: true,
          nombre: true,
          slug: true,
        },
      });
  
      if (!productionLine) {
        return [];
      }
  
      const productos = await this.prisma.products.findMany({
        where: {
          linea_id: productionLine.id,
          estado: 'ACTIVO',
          proceso: 'COMPLETO',
          is_web: 'SI',
        },
        select: {
          id: true,
          token: true,
          nombre: true,
          image: true,
          id_presentacion_web: true,
        },
      });
  
      const formattedProducts = await Promise.all(
        productos.map(async (product) => {
          let valorFinal = 0;
          let nombrePresentacion = '';
          let cantidadPresentaciones = 0;
  
          if (product.id_presentacion_web) {
            const presentation = await this.prisma.presentations.findUnique({
              where: { id: product.id_presentacion_web },
              select: { variacion: true, id_base: true, nombre: true },
            });
  
            if (presentation) {
              nombrePresentacion = presentation.nombre ?? '';
  
              const acabado = await this.prisma.product_acabados.findFirst({
                where: {
                  id_producto: product.id,
                  id_acabado: presentation.id_base,
                  estado: 'VIGENTE',
                },
                select: { val2: true },
              });
  
              if (acabado) {
                valorFinal = acabado.val2;
                if (presentation.variacion && presentation.variacion !== 0) {
                  valorFinal = valorFinal * (1 + presentation.variacion / 100);
                }
                valorFinal = Math.round(valorFinal);
              }
  
              const productAcabados = await this.prisma.product_acabados.findMany({
                where: {
                  id_producto: product.id,
                  estado: 'VIGENTE',
                },
                select: { id_acabado: true },
              });
  
              const idAcabados = productAcabados.map((a) => a.id_acabado);
  
              cantidadPresentaciones = await this.prisma.presentations.count({
                where: {
                  estado: 'ACTIVO',
                  is_web: 'SI',
                  id_base: { in: idAcabados },
                },
              });
            }
          }
  
          return {
            token: product.token,
            nombre: product.nombre,
            image: product.image,
            valor: valorFinal,
            presentacion: nombrePresentacion,
            cantidad_presentaciones: cantidadPresentaciones - 1,
          };
        })
      );
  
      return [
        {
          id: productionLine.id,
          nombre: productionLine.nombre,
          slug: productionLine.slug,
          products: formattedProducts,
        },
      ];
    } catch (error) {
      console.error('Error fetching insumo with products:', error);
      throw new Error('Failed to fetch insumo with products');
    }
  }

}
