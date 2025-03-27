import { Module } from '@nestjs/common';
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


@Module({
  imports: [
    ProductsModule,
    PrismaModule,
    CollectionsModule,
    CategoriesModule,
    CommercialLineModule,
    MaterialModule,
    ProductionLineModule,
    FinishesModule,

  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
