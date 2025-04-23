import { Injectable, InternalServerErrorException, Logger  } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class MaterialService {

  private readonly logger = new Logger(MaterialService.name);

  constructor(private prisma: PrismaService) { }


  async findAll() {
    // Obtenemos todos los insumos
    const materials = await this.prisma.insumos.findMany({
      select: {
        id: true,
        nombre: true,
        slug: true,
      },
    });

    return materials.map(material => ({
      id_origen: material.id,
      nombre: material.nombre,
      slug: material.slug,
    }));
  }


  async findBySlug(slug: string) {
    try {
      // 1. Obtener insumo principal
      const insumo = await this.prisma.insumos.findFirst({
        where: { slug },
        select: { id: true, nombre: true, slug: true }
      });
  
      if (!insumo) return [];
  
      // 2. Obtener productos con relaciones necesarias
      const productos = await this.prisma.products.findMany({
        where: {
          insumo_id: insumo.id,
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
      });
  
      // 3. Obtener datos relacionados en consultas paralelas
      const presentationIds = productos.map(p => p.id_presentacion_web).filter(Boolean) as number[];
      
      const [presentations, allAcabados] = await Promise.all([
        this.prisma.presentations.findMany({
          where: { id: { in: presentationIds } },
          select: { id: true, nombre: true, variacion: true, id_base: true }
        }),
        this.prisma.acabados.findMany({
          where: { estado: 'ACTIVO' },
          select: { id: true }
        })
      ]);
  
      // 4. Crear estructuras para acceso rápido
      const presentationMap = new Map(presentations.map(p => [p.id, p]));
      const validAcabadoIds = new Set(allAcabados.map(a => a.id));
  
      // 5. Pre-calcular presentaciones por acabado
      const presentationCounts = await this.prisma.presentations.groupBy({
        by: ['id_base'],
        where: {
          estado: 'ACTIVO',
          is_web: 'SI',
          id_base: { in: [...validAcabadoIds] }
        },
        _count: true
      });
  
      const countMap = new Map(presentationCounts.map(pc => [pc.id_base, pc._count]));
  
      // 6. Procesar productos
      const formattedProducts = productos.map(product => {
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
              valorFinal = Math.round(valorFinal * (1 + presentation.variacion / 100));
            }
          }
  
          // Calcular presentaciones válidas
          const acabadosProducto = product.product_acabados
            .map(pa => pa.id_acabado)
            .filter(id => validAcabadoIds.has(id));
  
          cantidadPresentaciones = acabadosProducto
            .reduce((sum, id) => sum + (countMap.get(id) || 0), 0);
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
      }).filter(p => p.valor > 0);
  
      return [{
        id: insumo.id,
        nombre: insumo.nombre,
        slug: insumo.slug,
        products: formattedProducts
      }];
      
    } catch (error) {
      this.logger.error(`Error en findBySlug (insumos): ${error.message}`);
      throw new InternalServerErrorException('Error al obtener insumo con productos');
    }
  }
  


}
