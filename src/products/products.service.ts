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

  async findOne(token: string) {
    try {

      const product = await this.prisma.products.findFirstOrThrow({
        where: {
          token: token,
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
          descripcion: true,
          estado: true,
          categories: { // Relación con categories
            select: {
              id: true,
              nombre: true,
            },
          },
          canal: { // Relación con canal
            select: {
              id: true,
              nombre: true,
            },
          },
          clasifica_collections: { // Relación con clasifica_collections
            select: {
              id: true,
              nombre: true,
            },
          },
          product_presentation_images: { // Relación con product_presentation_images
            where: {
              estado: 'ACTIVO', // Filtra solo las imágenes activas
            },
            select: {
              id: true,
              imagen: true,
              orden: true,
              presentations: { // Relación con presentations
                select: {
                  id: true,
                  id_base: true,
                  nombre: true,
                  hexa: true,
                  variacion: true,
                  acabados: { // Relación con acabados
                    select: {
                      id: true,
                      nombre: true,
                    },
                  },
                },
              },
            },
          },
          product_acabados: { // Relación con product_acabados
            where: {
              estado: 'VIGENTE',
              val2: { gt: 0 },
            },
            select: {
              id: true,
              id_acabado: true,
              val2: true,
            },
          },
        },
      });
      // Calcular el valor de la presentación
      const productWithCalculatedValues = {
        ...product,
        product_presentation_images: product.product_presentation_images.map(image => {
          const presentation = image.presentations;
          const acabadoId = presentation.acabados.id;
          const productAcabado = product.product_acabados.find(pa => pa.id_acabado === acabadoId);
          const val2 = productAcabado ? productAcabado.val2 : 0;
          const variacion = presentation.variacion || 0;
          const valorPresentacion = val2 * (1 + variacion / 100); // Calcula el valor con la variación

          return {
            ...image,
            valorPresentacion: valorPresentacion, // Agrega el valor calculado
          };
        }),
      };





      return productWithCalculatedValues;

    } catch (error) {
      console.error('Error fetching product:', error);
      throw new Error('Failed to fetch product');
    }

  }


}
