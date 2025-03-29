import { Injectable, InternalServerErrorException, Logger  } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollectionsService {

  private readonly logger = new Logger(CollectionsService.name);


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
              id_presentacion_web: { not: null }
            },
            select: {
              id: true,
              token: true,
              nombre: true,
              image: true,
              id_presentacion_web: true,
              product_acabados: {
                where: {
                  estado: 'VIGENTE',
                  val2: { not: 0 }
                },
                select: {
                  id_acabado: true,
                  val2: true
                }
              },
              producto_presentacion_ofertas: {
                select: { id: true }
              }
            }
          }
        }
      });
  
      // Obtener todos los IDs de presentaciones únicos
      const presentationIds = [
        ...new Set(
          collections.flatMap(collection => {
            return collection.products.map(p => p.id_presentacion_web);
          })
        )
      ].filter(Boolean) as number[];
  
      // Consultas paralelas para datos relacionados
      const [presentations, validAcabados] = await Promise.all([
        this.prisma.presentations.findMany({
          where: {
            id: { in: presentationIds },
            estado: 'ACTIVO',
            is_web: 'SI'
          },
          select: {
            id: true,
            nombre: true,
            variacion: true,
            id_base: true
          }
        }),
        this.prisma.acabados.findMany({
          where: { estado: 'ACTIVO' },
          select: { id: true }
        })
      ]);
  
      // Crear estructuras para acceso rápido
      const presentationMap = new Map(presentations.map(p => [p.id, p]));
      const validAcabadoIds = new Set(validAcabados.map(a => a.id));
  
      return collections.map(collection => ({
        id: collection.id,
        nombre: collection.nombre,
        slug: collection.slug,
        products: collection.products
          .map(product => {
            const presentation = presentationMap.get(product.id_presentacion_web!);
            let valorFinal = 0;
            let cantidadPresentaciones = 0;
  
            if (presentation) {
              // Calcular valor final
              const acabado = product.product_acabados.find(
                pa => pa.id_acabado === presentation.id_base
              );
              
              if (acabado?.val2) {
                valorFinal = acabado.val2;
                if (presentation.variacion) {
                  valorFinal *= (1 + presentation.variacion / 100);
                }
                valorFinal = Math.round(valorFinal);
              }
  
              // Calcular presentaciones válidas
              cantidadPresentaciones = product.product_acabados
                .filter(pa => validAcabadoIds.has(pa.id_acabado))
                .length;
            }
  
            return {
              token: product.token,
              nombre: product.nombre,
              image: product.image,
              valor: valorFinal,
              presentacion: presentation?.nombre || '',
              cantidad_presentaciones: cantidadPresentaciones -1,
              oferta: product.producto_presentacion_ofertas.length > 0
            };
          })
          .filter(product => product.valor > 0) // Filtrar productos sin valor
      }));
      
    } catch (error) {
      this.logger.error(`Error en findAllWithProducts: ${error.message}`);
      throw new InternalServerErrorException('Error al obtener colecciones');
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
              id_presentacion_web: { not: null }
            },
            select: {
              id: true,
              token: true,
              nombre: true,
              image: true,
              id_presentacion_web: true,
              product_acabados: {
                where: {
                  estado: 'VIGENTE',
                  val2: { not: 0 }
                },
                select: {
                  id_acabado: true,
                  val2: true
                }
              },
              producto_presentacion_ofertas: {
                select: { id: true }
              }
            }
          }
        }
      });
  
      // Obtener todos los IDs de presentaciones necesarios
      const presentationIds = collections.flatMap(collection =>
        collection.products.map(p => p.id_presentacion_web)
      ).filter(Boolean) as number[];
  
      // Consultas paralelas para datos relacionados
      const [presentations, validAcabados] = await Promise.all([
        this.prisma.presentations.findMany({
          where: {
            id: { in: presentationIds },
            estado: 'ACTIVO',
            is_web: 'SI'
          },
          select: {
            id: true,
            nombre: true,
            variacion: true,
            id_base: true
          }
        }),
        this.prisma.acabados.findMany({
          where: { estado: 'ACTIVO' },
          select: { id: true }
        })
      ]);
  
      // Crear estructuras para acceso rápido
      const presentationMap = new Map(presentations.map(p => [p.id, p]));
      const validAcabadoIds = new Set(validAcabados.map(a => a.id));
  
      return collections.map(collection => ({
        id: collection.id,
        nombre: collection.nombre,
        slug: collection.slug,
        products: collection.products
          .map(product => {
            const presentation = presentationMap.get(product.id_presentacion_web!);
            let valorFinal = 0;
  
            if (presentation) {
              const acabado = product.product_acabados.find(
                pa => pa.id_acabado === presentation.id_base
              );
              
              if (acabado?.val2) {
                valorFinal = acabado.val2;
                if (presentation.variacion) {
                  valorFinal *= (1 + presentation.variacion / 100);
                }
                valorFinal = Math.round(valorFinal);
              }
            }
  
            const presentacionesValidas = product.product_acabados
              .filter(pa => validAcabadoIds.has(pa.id_acabado))
              .length;
  
            return {
              token: product.token,
              nombre: product.nombre,
              image: product.image,
              valor: valorFinal,
              presentacion: presentation?.nombre || '',
              cantidad_presentaciones: presentacionesValidas,
              oferta: product.producto_presentacion_ofertas.length > 0
            };
          })
          .filter(product => product.valor > 0)
      }));
      
    } catch (error) {
      this.logger.error(`Error en findBySlug: ${error.message}`);
      throw new InternalServerErrorException('Error al obtener colecciones');
    }
  }
  


}
