import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { CommercialLineService } from './commercial-line.service';


@Controller('commercial-lines')
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
