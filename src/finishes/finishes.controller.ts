import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { FinishesService } from './finishes.service';


@Controller('finishes')
export class FinishesController {
  constructor(private readonly finishesService: FinishesService) {}



  @Get()
  async findAll() {
    try {
      const finishes = await this.finishesService.findAll();
      return {
        status:'success',
        data: finishes,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to fetch finishes',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.finishesService.findBySlug(slug);
  }


}
