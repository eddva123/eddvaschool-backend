import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiBridgeService } from './ai-bridge.service';
import { AiBridgeController } from './ai-bridge.controller';
import { AIModule } from '../../ai/ai.module';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        timeout: cfg.get<number>('ai.timeoutMs'),
        maxRedirects: 3,
      }),
    }),
    AIModule,
  ],
  controllers: [AiBridgeController],
  providers: [AiBridgeService],
  exports: [AiBridgeService],
})
export class AiBridgeModule {}
