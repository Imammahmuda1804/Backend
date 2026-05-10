import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';
import { NlpService } from './modules/nlp/nlp.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly nlpService: NlpService,
  ) { }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-nlp')
  @Public()
  @ApiOperation({ summary: 'Test FastAPI connection' })
  @ApiResponse({ status: 200, description: 'FastAPI connection test result' })
  async testNlp() {
    try {
      const isHealthy = await this.nlpService.healthCheck();
      return {
        status: 'success',
        fastapi_healthy: isHealthy,
        message: isHealthy
          ? 'FastAPI is accessible from NestJS'
          : 'FastAPI health check failed',
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
