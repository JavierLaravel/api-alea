import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Controller('sales')
@UseGuards(ApiKeyGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) { }

  @Post('create')
  @HttpCode(HttpStatus.OK)
  async checkOrCreate(@Body() dto: CreateSaleDto) {
    const { id, wasCreated } = await this.salesService.create(dto);
    return {
      id,
      created: wasCreated,
      message: wasCreated
        ? 'Registro creado correctamente.'
        : 'Registro ya existía con la misma observación.',
    };
  }

}
