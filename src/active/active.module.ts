import { Module } from '@nestjs/common';
import { ActiveService } from './active.service';
import { ActiveController } from './active.controller';

@Module({
  controllers: [ActiveController],
  providers: [ActiveService],
})
export class ActiveModule {}
