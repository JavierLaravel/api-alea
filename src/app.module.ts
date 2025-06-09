import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

import { ProductsModule } from './products/products.module';
import { PrismaModule } from './prisma/prisma.module';
import { CollectionsModule } from './collections/collections.module';
import { CategoriesModule } from './categories/categories.module';
import { CommercialLineModule } from './commercial-line/commercial-line.module';
import { MaterialModule } from './material/material.module';
import { ProductionLineModule } from './production-line/production-line.module';
import { FinishesModule } from './finishes/finishes.module';
import { ActiveModule } from './active/active.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ProductsModule,
    PrismaModule,
    CollectionsModule,
    CategoriesModule,
    CommercialLineModule,
    MaterialModule,
    ProductionLineModule,
    FinishesModule,
    ActiveModule,

  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
