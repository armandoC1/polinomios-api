import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'https://polinomios-app.vercel.app/', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    allowedHeaders: ['Content-Type'],
  });

  await app.listen(3000); 
  console.log(`🚀 Servidor corriendo en http://localhost:3000`);
}
bootstrap();
