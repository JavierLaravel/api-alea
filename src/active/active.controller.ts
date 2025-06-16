import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards  } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard'; 
import { ActiveService } from './active.service';


@Controller('active')
@UseGuards(ApiKeyGuard)
export class ActiveController {
  constructor(private readonly activeService: ActiveService) { }

  @Get()
  getOk(): string {
    console.log('active');
    return 'ok';
  }
}
