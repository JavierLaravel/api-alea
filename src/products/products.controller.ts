import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';



@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get()
  async findAll() {
    try {
      const products = await this.productsService.findAll();
      return {
        status: 'success',
        count: products.length,
        data: products,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to fetch products',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':token')
  findOne(@Param('token') token: string) {
    return this.productsService.findOne(token);
  }



}
