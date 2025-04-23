import { Injectable, InternalServerErrorException, Logger  } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';





@Injectable()
export class CategoriesService {

  private readonly logger = new Logger(CategoriesService.name);

  constructor(private prisma: PrismaService) { }

  async findAll() {
    const collections = await this.prisma.categories.findMany({
      select: {
        id: true,
        nombre: true,
        slug: true,
        estado: true,
      }
    });

    return collections.map((collection) => ({
      id_origen: collection.id,
      nombre: collection.nombre,
      slug: collection.slug,
      estado: collection.estado,
    }));
  }

  async findBySlug(slug: string) {
    try {
      // Primera consulta: Obtener todas las categorías con productos y relaciones necesarias
      const categories = await this.prisma.categories.findMany({
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
              id_presentacion_web: { not: null } // Filtramos productos con presentación web
            },
            select: {
              id: true,
              token: true,
              nombre: true,
              image: true,
              id_presentacion_web: true,
              // Incluimos relaciones necesarias para evitar múltiples consultas
              product_acabados: {
                where: {
                  estado: 'VIGENTE',
                  val2: { not: 0 } // Primer ajuste: excluir val2 = 0
                },
                select: {
                  id_acabado: true,
                  val2: true
                }
              },
              producto_presentacion_ofertas: {
                select: { id: true } // Solo necesitamos saber si existe
              }
            }
          }
        }
      });
  
      // Segunda consulta: Obtener todas las presentaciones necesarias en una sola query
      const allPresentationIds = categories.flatMap(category => 
        category.products.map(p => p.id_presentacion_web).filter(Boolean)
      );
      
      const presentations = await this.prisma.presentations.findMany({
        where: { 
          id: { in: allPresentationIds as number[] },
          estado: 'ACTIVO',
          is_web: 'SI'
        },
        select: {
          id: true,
          nombre: true,
          variacion: true,
          id_base: true
        }
      });
  
      // Tercera consulta: Obtener todos los acabados base válidos
      const allBaseIds = presentations.map(p => p.id_base);
      const validAcabados = await this.prisma.acabados.findMany({
        where: {
          id: { in: allBaseIds },
          estado: 'ACTIVO'
        },
        select: { id: true }
      });
  
      // Procesamiento de datos
      const validAcabadoIds = new Set(validAcabados.map(a => a.id));
      const presentationMap = new Map(presentations.map(p => [p.id, p]));
  
      return categories.map(category => ({
        id: category.id,
        nombre: category.nombre,
        slug: category.slug,
        products: category.products.map(product => {
          const presentation = presentationMap.get(product.id_presentacion_web!);
          
          // Calcular valorFinal
          let valorFinal = 0;
          if (presentation) {
            const acabado = product.product_acabados.find(
              pa => pa.id_acabado === presentation.id_base
            );
            
            if (acabado) {
              valorFinal = acabado.val2;
              if (presentation.variacion) {
                valorFinal *= (1 + presentation.variacion / 100);
              }
              valorFinal = Math.round(valorFinal);
            }
          }
  
          // Calcular cantidad de presentaciones válidas
          const validProductAcabados = product.product_acabados
            .filter(pa => validAcabadoIds.has(pa.id_acabado));
  
          return {
            token: product.token,
            nombre: product.nombre,
            image: product.image,
            valor: valorFinal,
            presentacion: presentation?.nombre || '',
            cantidad_presentaciones: validProductAcabados.length -1,
            oferta: product.producto_presentacion_ofertas.length > 0 // Segundo ajuste
          };
        }).filter(product => product.valor > 0) // Excluir productos sin valor válido
      }));
      
    } catch (error) {
      this.logger.error(`Error en findBySlug: ${error.message}`);
      throw new InternalServerErrorException('Error al obtener categorías');
    }
  }
  

 
}
