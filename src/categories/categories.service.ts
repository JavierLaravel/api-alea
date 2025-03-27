import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';



@Injectable()
export class CategoriesService {

  constructor(private prisma: PrismaService) { }

  async findAll() {
    const collections = await this.prisma.categories.findMany({
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
        estado: 'ACTIVO',
      },
    });

    return collections.map((collection) => ({
      id: collection.id,
      nombre: collection.nombre,
      slug: collection.slug,
      cantidad: collection.products.length,
    }));
  }

  async findBySlug(slug: string) {
    try {
      const categories = await this.prisma.categories.findMany({
        where: {
          slug: slug,
        },
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
  
      const formattedCategories = await Promise.all(
        categories.map(async (category) => {
          const products = await Promise.all(
            category.products.map(async (product) => {
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
  
          return {
            id: category.id,
            nombre: category.nombre,
            slug: category.slug,
            products,
          };
        })
      );
  
      return formattedCategories;
    } catch (error) {
      console.error('Error fetching categories with products:', error);
      throw new Error('Failed to fetch categories with products');
    }
  }
  

 
}
