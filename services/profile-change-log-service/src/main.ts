import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ProfileChangeLogModule } from './profile-change-log.module';

async function bootstrap() {
  const app = await NestFactory.create(ProfileChangeLogModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`Profile Change Log Service is running on port ${port}`);
}
bootstrap();
