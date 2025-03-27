import { Module } from '@nestjs/common';
import { FinishesService } from './finishes.service';
import { FinishesController } from './finishes.controller';


@Module({
  controllers: [FinishesController],
  providers: [FinishesService],
})
export class FinishesModule {}
