import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AttendanceModule } from './attendance.module';

async function bootstrap() {
  const app = await NestFactory.create(AttendanceModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`Attendance Service is running on port ${port}`);
}
bootstrap();
