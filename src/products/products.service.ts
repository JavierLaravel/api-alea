import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class ProductsService {

  constructor(private prisma: PrismaService) { }

  /*async findAll() {
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
  }*/

    async findOneByToken(token: string) {
      try {
        const product = await this.prisma.products.findFirstOrThrow({
          where: {
            token,
            estado: 'ACTIVO',
            proceso: 'COMPLETO',
            is_web: 'SI',
          },
          include: {
            categories: { select: { id: true, nombre: true } },
            canal: { select: { id: true, nombre: true } },
            clasifica_collections: { select: { id: true, nombre: true } },
            product_acabados: {
              where: {
                estado: 'VIGENTE',
                val2: { gt: 0 },
                acabados: {
                  presentations: {
                    some: {
                      is_web: 'SI',
                      estado: 'ACTIVO'
                    }
                  }
                }
              },
              include: {
                acabados: {
                  include: {
                    presentations: {
                      where: { 
                        is_web: 'SI',
                        estado: 'ACTIVO'
                      },
                      include: {
                        product_presentation_images: {
                          where: { estado: 'ACTIVO' },
                          orderBy: { orden: 'asc' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
        });
    
        // Obtener todos los IDs de presentaciones válidas
        const presentationIds = product.product_acabados.flatMap(pa => 
          pa.acabados.presentations.map(p => p.id)
        );
    
        // Obtener ofertas específicas para este producto
        const discounts = await this.prisma.producto_presentacion_ofertas.findMany({
          where: {
            producto_id: product.id,
            presentacion_id: { in: presentationIds },
            estado: 'VIGENTE'
          }
        });
    
        const presentations = product.product_acabados.flatMap(pa => 
          pa.acabados.presentations.map(pres => {
            const baseValue = pa.val2;
            const variation = pres.variacion || 0;
            const originalValue = Math.round(baseValue * (1 + variation / 100));
            
            // Buscar descuento específico para esta combinación producto-presentación
            const discount = discounts.find(d => 
              d.presentacion_id === pres.id && d.producto_id === product.id
            );
    
            const hasDiscount = !!discount;
            const discountPercent = discount?.porcentaje ? Number(discount.porcentaje) : 0;
            const discountValue = hasDiscount 
              ? Math.round(originalValue * (1 - discountPercent / 100))
              : originalValue;
    
            return {
              id: pres.id,
              nombre: pres.nombre,
              hexa: pres.hexa,
              valor: originalValue,
              valdescuento: discountValue,
              descuento: hasDiscount,
              porcentaje: discountPercent,
              imagen: pres.product_presentation_images[0]?.imagen || null,
              orden: pres.product_presentation_images[0]?.orden || null,
            };
          })
        ).filter(p => p.valor > 0);
    
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
          presentations: presentations.sort((a, b) => (a.orden || 0) - (b.orden || 0)),
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
            let tieneDescuento = false;
  
            if (product.id_presentacion_web) {
              const presentation = await this.prisma.presentations.findUnique({
                where: { id: product.id_presentacion_web },
                select: { 
                  variacion: true, 
                  id_base: true, 
                  nombre: true,
                  id: true 
                },
              });
    
              if (presentation) {
                nombrePresentacion = presentation.nombre ?? '';
                
                // Verificar descuento
                const descuento = await this.prisma.producto_presentacion_ofertas.findFirst({
                  where: {
                    producto_id: product.id,
                    presentacion_id: presentation.id,
                    estado: 'VIGENTE'
                  }
                });
                
                tieneDescuento = !!descuento;
  
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
              descuento: tieneDescuento // Nuevo campo agregado
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
