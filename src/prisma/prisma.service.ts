import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private static instance: PrismaService;

  constructor() {
    if (PrismaService.instance) {
      return PrismaService.instance;
    }

    super();
    PrismaService.instance = this;
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.error('Error conectando a Prisma:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (error) {
      console.error('Error desconectando Prisma:', error);
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
