import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard';
import { PersonsService } from './persons.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

@Controller('persons')
@UseGuards(ApiKeyGuard)
export class PersonsController {
  constructor(private readonly personsService: PersonsService) { }

  @Post('check-or-create')
  async checkOrCreate(@Body() dto: CreatePersonDto) {
    return this.personsService.checkOrCreate(dto);
  }


}
