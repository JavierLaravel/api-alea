import { Controller, Get, Param, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard'; 
import { FinishesService } from './finishes.service';


@Controller('finishes')
@UseGuards(ApiKeyGuard)
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
