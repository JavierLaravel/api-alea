import { Controller, Get, Param, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard'; 
import { CommercialLineService } from './commercial-line.service';


@Controller('commercial-lines')
@UseGuards(ApiKeyGuard)
export class CommercialLineController {
  constructor(private readonly commercialLineService: CommercialLineService) {}

  @Get()
  async findAll() {
    try {
      const commercialLine = await this.commercialLineService.findAll();
      return {
        status: 'success',
        count: commercialLine.length,
        data: commercialLine,
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
  findOne(@Param('slug') slug: string) {
    return this.commercialLineService.findBySlug(slug);
  }

}
