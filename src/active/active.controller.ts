import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ActiveService } from './active.service';


@Controller('active')
export class ActiveController {
  constructor(private readonly activeService: ActiveService) { }

  @Get()
  getOk(): string {
    return 'ok';
  }
}
