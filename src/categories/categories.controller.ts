import { Controller, Get, Param, HttpException, HttpStatus, UseGuards  } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard'; 
import { CategoriesService } from './categories.service';


@Controller('categories')
@UseGuards(ApiKeyGuard)

export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll() {
    try {
      const categories = await this.categoriesService.findAll();
      return {
        status: 'success',
        count: categories.length,
        data: categories,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to fetch categories',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }


}
