import { Controller, Get, Module } from '@nestjs/common';

@Controller('health')
class HealthController {
  @Get()
  health() {
    return { status: 'ok', service: 'redemption-api' };
  }
}

// DatabaseModule is available for feature modules once a database is configured.
@Module({ controllers: [HealthController] })
export class AppModule {}
