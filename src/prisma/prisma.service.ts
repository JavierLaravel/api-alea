import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        await this.$connect(); // Conecta a la base de datos cuando el módulo se inicializa
    }

    async onModuleDestroy() {
        await this.$disconnect(); // Desconecta de la base de datos cuando el módulo se destruye
    }
}