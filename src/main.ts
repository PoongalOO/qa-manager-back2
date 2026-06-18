import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global route prefix (set when the app is deployed under a subpath, e.g. /qa-manager-backend)
  const apiPrefix = process.env.API_PREFIX;
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }

  // CORS
  const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:4200';
  app.enableCors({
    origin: [frontendOrigin, 'http://localhost:4200', 'http://localhost:8000', 'http://localhost:3000'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
  });

  // Rate limiting: 1000 requests per 60 minutes per IP
  app.use(
    rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Serve static files from public directory
  app.useStaticAssets(path.join(process.cwd(), 'public'), {
    prefix: apiPrefix ? `/${apiPrefix}/public` : '/public',
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT || 8001;
  await app.listen(port);
  console.log(`Application running on port ${port}`);
}
bootstrap();
