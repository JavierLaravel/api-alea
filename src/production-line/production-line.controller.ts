import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ProductionLineService } from './production-line.service';


@Controller('production-lines')
export class ProductionLineController {

  constructor(private readonly productionLineService: ProductionLineService) {}

 
  @Get()
  async findAll() {
    try {
      const materials = await this.productionLineService.findAll();
      return {
        status:'success',
        data: materials,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to fetch Commercial Lines',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productionLineService.findBySlug(slug);
  }

}
