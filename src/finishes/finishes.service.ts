import { Injectable, InternalServerErrorException  } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';



@Injectable()
export class FinishesService {

  constructor(private prisma: PrismaService) { }


  async findAll() {
    try {
      const presentations = await this.prisma.presentations.findMany({
        where: {
          estado: 'ACTIVO',
          is_web: 'SI',
        },
        select: {
          id: true,
          id_base: true,
          slug: true,
          nombre: true,
        },
      });

      const result = await Promise.all(
        presentations.map(async (pres) => {
          try {
            const cantidad = await this.prisma.products.count({
              where: {
                estado: 'ACTIVO',
                proceso: 'COMPLETO',
                is_web: 'SI',
                product_acabados: {
                  some: {
                    estado: 'VIGENTE',
                    id_acabado: pres.id_base,
                  },
                },
              },
            });

            return {
              slug: pres.slug,
              nombre: pres.nombre,
              cantidad,
            };
          } catch (err) {
            console.error(`Error contando productos para presentación ${pres.slug}`, err);
            return {
              slug: pres.slug,
              nombre: pres.nombre,
              cantidad: 0,
            };
          }
        }),
      );

      return result;
    } catch (error) {
      console.error('Error al obtener presentaciones con productos:', error);
      throw new InternalServerErrorException('Error al obtener las presentaciones');
    }
  }

  async findBySlug(slug: string) {
    try {
      const presentation = await this.prisma.presentations.findFirst({
        where: { slug },
        select: {
          id: true,
          slug: true,
          id_base: true,
          nombre: true,
          variacion: true,
        },
      });
  
      if (!presentation) {
        throw new Error(`No se encontró presentación con slug: ${slug}`);
      }
  
      const productos = await this.prisma.products.findMany({
        where: {
          estado: 'ACTIVO',
          proceso: 'COMPLETO',
          is_web: 'SI',
          product_acabados: {
            some: {
              estado: 'VIGENTE',
              id_acabado: presentation.id_base,
            },
          },
        },
        select: {
          id: true,
          token: true,
          nombre: true,
          image: true,
          product_acabados: {
            where: {
              estado: 'VIGENTE',
              id_acabado: presentation.id_base,
            },
            select: {
              val2: true,
            },
          },
        },
      });
  
      const result = await Promise.all(
        productos.map(async (product) => {
          const val2 = product.product_acabados[0]?.val2 ?? 0;
          let valor = val2;
  
          if (presentation.variacion && presentation.variacion !== 0) {
            valor = Math.round(val2 * (1 + presentation.variacion / 100));
          }
  
          const acabados = await this.prisma.product_acabados.findMany({
            where: {
              id_producto: product.id,
              estado: 'VIGENTE',
            },
            select: {
              id_acabado: true,
            },
          });
  
          const idAcabados = acabados.map((a) => a.id_acabado);
  
          const cantidadPresentaciones = await this.prisma.presentations.count({
            where: {
              estado: 'ACTIVO',
              is_web: 'SI',
              id_base: {
                in: idAcabados,
              },
            },
          });
  
          return {
            token: product.token,
            nombre: product.nombre,
            image: product.image,
            presentacion: presentation.nombre,
            valor,
            cantidad_presentaciones: cantidadPresentaciones -1,
          };
        }),
      );

      return [{
        id: presentation.id,
        nombre: presentation.nombre,
        slug: presentation.slug,
        products: result,
      }];
  
      return result;
    } catch (error) {
      console.error('Error al obtener productos por presentación:', error);
      throw new Error('Error al obtener productos');
    }
  }
  

}
