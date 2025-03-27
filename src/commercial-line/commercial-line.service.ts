import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommercialLineService {

  constructor(private prisma: PrismaService) { }

  async findAll() {
    const commercialLines = await this.prisma.canal.findMany({
      select: {
        id: true,
        nombre: true,
        slug: true,
        products: {
          select: {
            id: true,
          },
          where: {
            estado: 'ACTIVO',
            proceso: 'COMPLETO',
            is_web: 'SI',
          },
        },
      },
      where: {
        nombre: {
          not: 'POR DEFINIR', 
        },
      },
    });

    return commercialLines.map((commercialLine) => ({
      id: commercialLine.id,
      nombre: commercialLine.nombre,
      slug: commercialLine.slug,
      cantidad: commercialLine.products.length,
    }));
  }

  async findBySlug(slug: string) {
    try {
      const collections = await this.prisma.canal.findMany({
        where: { slug },
        select: {
          id: true,
          nombre: true,
          slug: true,
          products: {
            where: {
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
          },
        },
      });
  
      const result = await Promise.all(
        collections.map(async (collection) => {
          const products = await Promise.all(
            collection.products.map(async (product) => {
              let valorFinal = 0;
              let nombrePresentacion = '';
              let cantidadPresentaciones = 0;
  
              if (product.id_presentacion_web) {
                const presentation = await this.prisma.presentations.findUnique({
                  where: { id: product.id_presentacion_web ?? undefined },
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
  
          return {
            id: collection.id,
            nombre: collection.nombre,
            slug: collection.slug,
            products,
          };
        })
      );
  
      return result;
    } catch (error) {
      console.error('Error in findBySlug (canal):', error);
      throw new Error('Failed to fetch canal with enriched product data');
    }
  }

  

}
