import { Injectable, InternalServerErrorException, Logger  } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class ProductionLineService {

  private readonly logger = new Logger(ProductionLineService.name);


  constructor(private prisma: PrismaService) { }


  async findAll() {
    // Obtenemos todos los insumos
    const productionLine = await this.prisma.lineas.findMany({
      select: {
        id: true,
        nombre: true,
        slug: true,
      },
    });

    return productionLine.map(productionLine => ({
      id_origen: productionLine.id,
      nombre: productionLine.nombre,
      slug: productionLine.slug,
    }));
  }

  async findBySlug(slug: string) {
    try {
      // 1. Obtener línea de producción
      const productionLine = await this.prisma.lineas.findFirst({
        where: { slug },
        select: { id: true, nombre: true, slug: true }
      });
  
      if (!productionLine) return [];
  
      // 2. Obtener productos con relaciones necesarias
      const productos = await this.prisma.products.findMany({
        where: {
          linea_id: productionLine.id,
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
              val3: { not: 0 }
            },
            select: {
              id_acabado: true,
              val3: true
            }
          },
          producto_presentacion_ofertas: {
            select: { id: true }
          }
        }
      });
  
      // 3. Obtener datos relacionados en paralelo
      const presentationIds = productos.map(p => p.id_presentacion_web).filter(Boolean) as number[];
      const productIds = productos.map(p => p.id);
  
      const [presentations, allAcabados, presentationCounts] = await Promise.all([
        this.prisma.presentations.findMany({
          where: { id: { in: presentationIds } },
          select: { id: true, nombre: true, variacion: true, id_base: true }
        }),
        this.prisma.product_acabados.findMany({
          where: {
            id_producto: { in: productIds },
            estado: 'VIGENTE'
          },
          select: { id_acabado: true, id_producto: true }
        }),
        this.prisma.presentations.groupBy({
          by: ['id_base'],
          where: {
            estado: 'ACTIVO',
            is_web: 'SI'
          },
          _count: true
        })
      ]);
  
      // 4. Crear estructuras de acceso rápido
      const presentationMap = new Map(presentations.map(p => [p.id, p]));
      const acabadosMap = allAcabados.reduce((acc, curr) => {
        if (!acc[curr.id_producto]) acc[curr.id_producto] = new Set();
        acc[curr.id_producto].add(curr.id_acabado);
        return acc;
      }, {});
      const countMap = new Map(presentationCounts.map(pc => [pc.id_base, pc._count]));
  
      // 5. Procesar productos
      const formattedProducts = productos.map(product => {
        const presentation = presentationMap.get(product.id_presentacion_web!);
        let valorFinal = 0;
        let cantidadPresentaciones = 0;
  
        if (presentation) {
          // Calcular valor final
          const acabado = product.product_acabados.find(
            pa => pa.id_acabado === presentation.id_base
          );
          
          if (acabado?.val3) {
            valorFinal = acabado.val3;
            if (presentation.variacion) {
              valorFinal = Math.round(valorFinal * (1 + presentation.variacion / 100));
            }
          }
  
          // Calcular presentaciones válidas
          const acabadosProducto = [...(acabadosMap[product.id] || [])];
          cantidadPresentaciones = acabadosProducto.reduce(
            (sum, id) => sum + (countMap.get(id) || 0),
            0
          );
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
        id: productionLine.id,
        nombre: productionLine.nombre,
        slug: productionLine.slug,
        products: formattedProducts
      }];
      
    } catch (error) {
      this.logger.error(`Error en findBySlug (líneas): ${error.message}`);
      throw new InternalServerErrorException('Error al obtener línea de producción con productos');
    }
  }

}
