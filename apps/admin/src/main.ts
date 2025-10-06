import { appFilter } from '@core/utils/swagger';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { APP_NAME } from './app.config';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create Nest application
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS
  app.enableCors();

  // Swagger documentation setup in non-production environment
  if (process.env.NODE_ENV !== 'production') {
    /* Swagger documentation */
    const SwaggerConfig = new DocumentBuilder()
      .setTitle('Admin App')
      .setDescription('Admin App API description')
      .setVersion('v1')
      .addBearerAuth()
      .addGlobalParameters({
        name: 'x-lang',
        in: 'header',
        required: false,
        schema: { type: 'string', example: 'en' },
        description: 'Language code (e.g., en, fr, es)',
      })
      .build();

    const document = SwaggerModule.createDocument(app, SwaggerConfig);
    SwaggerModule.setup('/docs', app, appFilter(document, APP_NAME));
  }

  // Body parsers for incoming requests
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));

  // Start the application
  await app.listen(process.env.PORT ?? 3000);
}

// Bootstrap the application and handle errors
bootstrap()
  .then(() => {
    console.log(`Application is running on: ${process.env.PORT ?? 3000}`);
  })
  .catch((err) => {
    console.error('Error during application bootstrap:', err);
  });
