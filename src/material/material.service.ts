import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class MaterialService {

  constructor(private prisma: PrismaService) { }


  async findAll() {
    // Obtenemos todos los insumos
    const material = await this.prisma.insumos.findMany({
      select: {
        id: true,
        nombre: true,
        slug: true,
      },
    });
  
    // Para cada insumo, contamos los productos relacionados que cumplen con las condiciones
    const materialCount = await Promise.all(
      material.map(async (material) => {
        const count = await this.prisma.products.count({
          where: {
            insumo_id: material.id, // Filtramos por el insumo actual
            estado: 'ACTIVO', // Solo productos activos
            proceso: 'COMPLETO', // Solo productos completos
            is_web: 'SI', // Solo productos disponibles en la web
          },
        });
  
        return {
          ...material,
          cantidad: count, // Agregamos el conteo al objeto del insumo
        };
      }),
    );
  
    return materialCount;
  }


  async findBySlug(slug: string) {
    try {
      const insumo = await this.prisma.insumos.findFirst({
        where: { slug },
        select: {
          id: true,
          nombre: true,
          slug: true,
        },
      });
  
      if (!insumo) return [];
  
      const productos = await this.prisma.products.findMany({
        where: {
          insumo_id: insumo.id,
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
  
      return [{
        id: insumo.id,
        nombre: insumo.nombre,
        slug: insumo.slug,
        products: formattedProducts,
      }];
    } catch (error) {
      console.error('Error fetching insumo with products:', error);
      throw new Error('Failed to fetch insumo with products');
    }
  }
  


}
