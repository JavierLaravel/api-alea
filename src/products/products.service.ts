import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class ProductsService {

  constructor(private prisma: PrismaService) { }

  async findAll() {
    try {
      const products = await this.prisma.products.findMany({
        where: {
          estado: 'ACTIVO',
          proceso: 'COMPLETO',
          is_web: 'SI',
        },
        select: {
          token: true,
          nombre: true,
          slug: true,
          image: true,
          product_acabados: {
            where: {
              estado: 'VIGENTE',
              val2: { gt: 0 }, // Filtra val2 > 0
            },
            select: {
              id_acabado: true,
              val2: true,
            },
            orderBy: {
              id_acabado: 'asc',
            },
            take: 1, // Toma solo el primer registro
          },
        },
        orderBy: {
          created_at: 'asc',
        },
        take: 10,
      });

      // Formatear la respuesta para incluir solo el primer product_acabado
      const formattedProducts = products.map(product => ({
        token: product.token,
        slug: product.slug,
        nombre: product.nombre,
        image: product.image,
        valor: product.product_acabados.length > 0 ? product.product_acabados[0].val2 : null, // Tomar el primer product_acabado
      }));

      return formattedProducts;

    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  async findOneByToken(token: string) {
    try {
      const product = await this.prisma.products.findFirstOrThrow({
        where: {
          token,
          estado: 'ACTIVO',
          proceso: 'COMPLETO',
          is_web: 'SI',
        },
        select: {
          id: true,
          token: true,
          nombre: true,
          slug: true,
          image: true,
          image1: true,
          image2: true,
          image3: true,
          descripcion: true,
          peso: true,
          ancho: true,
          alto: true,
          grosor: true,
          estado: true,
          categories: {
            select: {
              id: true,
              nombre: true,
            },
          },
          canal: {
            select: {
              id: true,
              nombre: true,
            },
          },
          clasifica_collections: {
            select: {
              id: true,
              nombre: true,
            },
          },
          product_acabados: {
            where: {
              estado: 'VIGENTE',
              val2: { gt: 0 },
            },
            select: {
              id_acabado: true,
              val2: true,
            },
          },
        },
      });
  
      // Extraer los id_acabado del producto
      const idAcabados = product.product_acabados.map((p) => p.id_acabado);
  
      // Buscar presentaciones asociadas a esos acabados y que sean web
      const presentations = await this.prisma.presentations.findMany({
        where: {
          id_base: { in: idAcabados },
          is_web: 'SI',
          estado: 'ACTIVO',
        },
        select: {
          id: true,
          nombre: true,
          hexa: true,
          variacion: true,
          id_base: true,
        },
      });
  
      // Buscar imágenes de presentación asociadas al producto
      const images = await this.prisma.product_presentation_images.findMany({
        where: {
          id_producto: product.id,
          estado: 'ACTIVO',
        },
        select: {
          id_presentacion: true,
          imagen: true,
          orden: true,
        },
      });
  
      // Asociar imágenes y calcular valor final
      const enrichedPresentations = presentations.map((pres) => {
        const acabado = product.product_acabados.find(
          (a) => a.id_acabado === pres.id_base,
        );
        const val2 = acabado ? acabado.val2 : 0;
        const variacion = pres.variacion ?? 0;
        const valor = Math.round(val2 * (1 + variacion / 100));
  
        const imagen = images.find((img) => img.id_presentacion === pres.id);
  
        return {
          id: pres.id,
          nombre: pres.nombre,
          hexa: pres.hexa,
          valor,
          imagen: imagen?.imagen ?? null,
          orden: imagen?.orden ?? null,
        };
      });
  
      // Resultado final
      return {
        token: product.token,
        nombre: product.nombre,
        slug: product.slug,
        image: product.image,
        image1: product.image1,
        image2: product.image2,
        image3: product.image3,
        peso: product.peso,
        ancho: product.ancho,
        alto: product.alto,
        grosor: product.grosor,
        descripcion: product.descripcion,
        estado: product.estado,
        categories: product.categories,
        canal: product.canal,
        clasifica_collections: product.clasifica_collections,
        presentations: enrichedPresentations,
      };
    } catch (error) {
      console.error('Error fetching product by token:', error);
      throw new Error('Failed to fetch product');
    }
  }
  

  async findRelated() {
    try {
      const products = await this.prisma.products.findMany({
        where: {
          estado: 'ACTIVO',
          proceso: 'COMPLETO',
          is_web: 'SI',
          id_presentacion_web: {
            not: null,
          },
        },
        select: {
          id: true,
          token: true,
          nombre: true,
          slug: true,
          image: true,
          id_presentacion_web: true,
        },
        orderBy: {
          created_at: 'asc',
        },
        take: 10,
      });
  
      const randomProducts = products
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);
  
      const formattedProducts = await Promise.all(
        randomProducts.map(async (product) => {
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
            slug: product.slug,
            nombre: product.nombre,
            image: product.image,
            valor: valorFinal,
            presentacion: nombrePresentacion,
            cantidad_presentaciones: cantidadPresentaciones,
          };
        })
      );
  
      return formattedProducts;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }
  
  

}
