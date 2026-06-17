import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { EventsModule } from './events/events.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ScoresModule } from './scores/scores.module.js';
import { SubmissionsModule } from './submissions/submissions.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    EventsModule,
    SubmissionsModule,
    ScoresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
