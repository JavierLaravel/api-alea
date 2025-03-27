import { Module } from '@nestjs/common';
import { CommercialLineService } from './commercial-line.service';
import { CommercialLineController } from './commercial-line.controller';

@Module({

  controllers: [CommercialLineController],
  providers: [CommercialLineService],
})
export class CommercialLineModule {}
