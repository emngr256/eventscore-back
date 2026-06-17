import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = process.env.DATABASE_URL || '';

    if (url.startsWith('prisma+postgres://')) {
      super({ accelerateUrl: url });
    } else if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
      super({ adapter: new PrismaPg({ connectionString: url }) });
    } else {
      super({} as any);
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected');
    } catch (err) {
      this.logger.error('Database connection failed, app will run without DB', err instanceof Error ? err.message : err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
