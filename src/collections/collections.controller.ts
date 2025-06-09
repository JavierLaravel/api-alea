import { Controller, Get, Param, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard'; 
import { CollectionsService } from './collections.service';


@Controller('collections')
@UseGuards(ApiKeyGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) { }



  @Get()
  async getAllCollections() {
    try {
      const collections = await this.collectionsService.getAllCollections();
      return {
        status: 'success',
        count: collections.length,
        data: collections,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to fetch collections',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/with-products')
  async findWithProducts() {
    try {
      const collections = await this.collectionsService.findAllWithProducts();
      return {
        status: 'success',
        count: collections.length,
        data: collections,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to fetch collections with products',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.collectionsService.findBySlug(slug);
  }


}
