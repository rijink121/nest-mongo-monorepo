import { TrimPipe } from '@core/pipes/trim.pipe';
import { isPrimaryInstance } from '@core/utils';
import { env } from '@core/utils/env';
import { appFilter, getSwaggerConfig } from '@core/utils/swagger';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { Environment } from '@shared/constants/app.contants';
import { useContainer } from 'class-validator';
import compression from 'compression';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import { join } from 'path';
import { appId, appName, appVersion } from './app.config';
import { AppModule } from './app.module';

async function bootstrap() {
  // Initialize environment configuration and AWS Secrets Manager if configured
  await env.initialize();
  // Create Nest application
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS
  app.enableCors();

  /* Loading config */
  const config = app.get(ConfigService);
  const appEnv = config.get<Environment>('env');
  if (appEnv !== Environment.Production) {
    /* Morgan logger in non-production env */
    const httpLogger = new Logger('HTTP');
    app.use(
      morgan('tiny', {
        stream: {
          write: (message: string) => httpLogger.log(message.trim()),
        },
      }),
    );
    // Swagger documentation setup in non-production environment
    const document = SwaggerModule.createDocument(
      app,
      getSwaggerConfig(appName, appVersion),
    );
    SwaggerModule.setup('/docs', app, appFilter(document, appId));
  }

  // Body parsers for incoming requests
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));

  /* Validation */
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useGlobalFilters(new I18nValidationExceptionFilter());
  app.useGlobalPipes(
    new TrimPipe(),
    new I18nValidationPipe({
      whitelist: true,
      transform: true,
      validationError: { target: false },
    }),
  );

  /* Trust proxy config */
  app.set('trust proxy', 1);
  /* Helmet */
  app.use(helmet({ crossOriginResourcePolicy: false }));
  /* CORS */
  app.enableCors();
  /* Compression */
  app.use(compression());
  /* MVC setup */
  app.setBaseViewsDir(join(__dirname, 'views'));
  app.setViewEngine('hbs');
  if (isPrimaryInstance()) {
    /* Micro service setup */
    app.connectMicroservice<MicroserviceOptions>(config.getOrThrow('ms'));
    await app.startAllMicroservices();
  }
  /* Starting app */
  const port = config.getOrThrow<number>('port');
  await app.listen(port);
}

// Bootstrap the application and handle errors
bootstrap()
  .then(() => {
    console.log(`Application is running on: ${process.env.PORT ?? 3000}`);
  })
  .catch((err) => {
    console.error('Error during application bootstrap:', err);
  });
