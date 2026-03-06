import { NestFactory, BaseExceptionFilter, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { Catch, ArgumentsHost, ClassSerializerInterceptor } from '@nestjs/common';
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

import helmet from 'helmet';
import * as compressionLib from 'compression';
// Handle default export differences across Node versions
const compression = typeof compressionLib === 'function' ? compressionLib : (compressionLib as any).default || compressionLib;
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as cluster from 'node:cluster';
import * as os from 'node:os';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.useWebSocketAdapter(new IoAdapter(app));
    app.use(helmet({
      contentSecurityPolicy: false,
    }));
    app.use(compression());
    app.enableCors();
    const { httpAdapter } = app.get(require('@nestjs/core').HttpAdapterHost);
    app.useGlobalFilters(new GlobalExceptionFilter(httpAdapter));
    // Apply global class serializer to strip @Exclude() properties (deletedAt, tenantId, etc)
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

    await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
    console.log(`Worker ${process.pid} started successfully.`);
  } catch (error) {
    console.error('Fatal error during application bootstrap:', error);
    process.exit(1);
  }
}

// @ts-ignore
if (cluster.default.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`Primary ${process.pid} is running`);
  console.log(`Booting ${numCPUs} worker processes...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    // @ts-ignore
    cluster.default.fork();
  }

  // @ts-ignore
  cluster.default.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    // @ts-ignore
    cluster.default.fork();
  });
} else {
  bootstrap();
}
