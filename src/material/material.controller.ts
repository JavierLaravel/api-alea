import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { MaterialService } from './material.service';


@Controller('materials')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Get()
  async findAll() {
    try {
      const materials = await this.materialService.findAll();
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
    return this.materialService.findBySlug(slug);
  }

}
