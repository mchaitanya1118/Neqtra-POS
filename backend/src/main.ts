import { NestFactory, BaseExceptionFilter } from '@nestjs/core';
import { AppModule } from './app.module';
import { Catch, ArgumentsHost } from '@nestjs/common';
import * as fs from 'fs';

@Catch()
class GlobalExceptionFilter extends BaseExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    fs.appendFileSync('error-log.txt', `\n--- ERROR AT ${new Date().toISOString()} ---\nPATH: ${request.url}\n`);
    if (exception && exception.stack) {
      fs.appendFileSync('error-log.txt', exception.stack + '\n');
    } else {
      fs.appendFileSync('error-log.txt', String(exception) + '\n');
    }

    super.catch(exception, host);
  }
}

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    const { httpAdapter } = app.get(require('@nestjs/core').HttpAdapterHost);
    app.useGlobalFilters(new GlobalExceptionFilter(httpAdapter));
    await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
  } catch (error) {
    console.error('Fatal error during application bootstrap:', error);
    process.exit(1);
  }
}
bootstrap();
