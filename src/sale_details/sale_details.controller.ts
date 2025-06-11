import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard'; 
import { SaleDetailsService } from './sale_details.service';
import { CreateSaleDetailDto } from './dto/create-sale_detail.dto';
import { UpdateSaleDetailDto } from './dto/update-sale_detail.dto';

@Controller('sale-details')
@UseGuards(ApiKeyGuard)
export class SaleDetailsController {
  constructor(private readonly saleDetailsService: SaleDetailsService) {}

  @Post('create')
  async create(@Body() dto: CreateSaleDetailDto) {
    const detail = await this.saleDetailsService.create(dto);
    return { id: detail.id };
  }
}
