import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollectionsService {

  constructor(private prisma: PrismaService) { }

  async getAllCollections() {
    const collections = await this.prisma.clasifica_collections.findMany({
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
    });

    return collections.map((collection) => ({
      id: collection.id,
      nombre: collection.nombre,
      slug: collection.slug,
      cantidad: collection.products.length,
    }));
  }

  async findAllWithProducts() {
    try {
      const collections = await this.prisma.clasifica_collections.findMany({
        where: { estado: 'VIGENTE' },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          nombre: true,
          slug: true,
          products: {
            where: {
              is_web: 'SI',
              estado: 'ACTIVO',
              proceso: 'COMPLETO',
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
                // Buscar datos de la presentación
                const presentation = await this.prisma.presentations.findUnique({
                  where: { id: product.id_presentacion_web },
                  select: { variacion: true, id_base: true, nombre: true },
                });
  
                if (presentation) {
                  nombrePresentacion = presentation.nombre ?? '';
  
                  // Buscar val2 en product_acabados
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
  
                  // Contar presentaciones activas
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
                cantidad_presentaciones: cantidadPresentaciones,
              };
            }),
          );
  
          return {
            id: collection.id,
            nombre: collection.nombre,
            slug: collection.slug,
            products,
          };
        }),
      );
  
      return result;
    } catch (error) {
      console.error('Error in findAllWithProductsV2:', error);
      throw new Error('Failed to fetch collections with enriched product data');
    }
  }
  

  async findBySlug(slug: string) {
    try {
      const collections = await this.prisma.clasifica_collections.findMany({
        where: { slug },
        orderBy: { created_at: 'desc' },
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
                cantidad_presentaciones: cantidadPresentaciones -1,
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
      console.error('Error in findBySlug:', error);
      throw new Error('Failed to fetch collection with enriched product data');
    }
  }
  


}
