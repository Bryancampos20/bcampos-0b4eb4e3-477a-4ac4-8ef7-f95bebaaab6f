import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Si ya usas prefijo global 'api', déjalo
  app.setGlobalPrefix('api');

  // 👇 Habilitar CORS para el frontend
  app.enableCors({
    origin: 'http://localhost:4200', // dashboard
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
