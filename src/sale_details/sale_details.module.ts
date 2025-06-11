import { Module } from '@nestjs/common';
import { SaleDetailsService } from './sale_details.service';
import { SaleDetailsController } from './sale_details.controller';

@Module({
  controllers: [SaleDetailsController],
  providers: [SaleDetailsService],
})
export class SaleDetailsModule {}
