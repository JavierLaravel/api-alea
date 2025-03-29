import { Injectable, InternalServerErrorException, Logger, NotFoundException  } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';



@Injectable()
export class FinishesService {

  private readonly logger = new Logger(FinishesService.name);


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
        select: { id: true, slug: true, id_base: true, nombre: true, variacion: true },
      });
  
      if (!presentation) {
        throw new NotFoundException(`Presentación con slug ${slug} no encontrada`);
      }
  
      // Paso 1: Obtener productos con sus acabados relevantes
      const productos = await this.prisma.products.findMany({
        where: {
          estado: 'ACTIVO',
          proceso: 'COMPLETO',
          is_web: 'SI',
          product_acabados: {
            some: {
              estado: 'VIGENTE',
              id_acabado: presentation.id_base,
              val2: { not: 0 }
            }
          }
        },
        select: {
          id: true,
          token: true,
          nombre: true,
          image: true,
          product_acabados: {
            where: {
              estado: 'VIGENTE',
              id_acabado: presentation.id_base
            },
            select: { val2: true }
          },
          producto_presentacion_ofertas: {
            select: { id: true }
          }
        }
      });
  
      // Paso 2: Obtener todos los acabados de los productos
      const productIds = productos.map(p => p.id);
      const allAcabados = await this.prisma.product_acabados.findMany({
        where: {
          id_producto: { in: productIds },
          estado: 'VIGENTE'
        },
        select: { id_acabado: true, id_producto: true }
      });
  
      // Paso 3: Obtener todas las presentaciones válidas
      const idAcabadosUnicos = [...new Set(allAcabados.map(a => a.id_acabado))];
      const presentacionesValidas = await this.prisma.presentations.findMany({
        where: {
          estado: 'ACTIVO',
          is_web: 'SI',
          id_base: { in: idAcabadosUnicos }
        },
        select: { id_base: true }
      });
  
      // Mapear presentaciones por acabado
      const presentacionesPorAcabado = presentacionesValidas.reduce((acc, curr) => {
        acc[curr.id_base] = (acc[curr.id_base] || 0) + 1;
        return acc;
      }, {});
  
      // Paso 4: Calcular presentaciones por producto
      const productsResult = productos.map(product => {
        const val2 = product.product_acabados[0]?.val2 ?? 0;
        let valor = val2;
  
        if (presentation.variacion) {
          valor = Math.round(val2 * (1 + presentation.variacion / 100));
        }
  
        // Obtener acabados del producto actual
        const acabadosDelProducto = allAcabados
          .filter(a => a.id_producto === product.id)
          .map(a => a.id_acabado);
  
        // Calcular presentaciones únicas
        const presentacionesUnicas = new Set(
          acabadosDelProducto
            .filter(id => presentacionesPorAcabado[id])
            .flatMap(id => Array(presentacionesPorAcabado[id]).fill(id))
        ).size;
  
        return {
          token: product.token,
          nombre: product.nombre,
          image: product.image,
          presentacion: presentation.nombre,
          valor,
          cantidad_presentaciones: presentacionesUnicas -1,
          oferta: product.producto_presentacion_ofertas.length > 0
        };
      }).filter(p => p.valor > 0);
  
      return [{
        id: presentation.id,
        nombre: presentation.nombre,
        slug: presentation.slug,
        products: productsResult
      }];
      
    } catch (error) {
      this.logger.error(`Error en findBySlug: ${error.message}`);
      throw new InternalServerErrorException('Error al obtener productos por presentación');
    }
  }
  

}
