import { RPServerContext } from '../../core/context';
import { ApiController } from '../types';
import { Controller, Get } from '../decorators';

/**
 * Health check controller
 */
@Controller('/health')
export class HealthController extends ApiController {
  constructor(context: RPServerContext) {
    super(context);
  }

  /**
   * Health check endpoint
   */
  @Get('/', {
    statusCode: 200,
  })
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
