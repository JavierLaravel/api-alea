import { Module } from '@nestjs/common';
import { ProductionLineService } from './production-line.service';
import { ProductionLineController } from './production-line.controller';

@Module({
  controllers: [ProductionLineController],
  providers: [ProductionLineService],
})
export class ProductionLineModule {}
