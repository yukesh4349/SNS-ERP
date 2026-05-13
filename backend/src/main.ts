import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  const allowedOrigins = appConfig.frontendOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      // Allow explicitly configured origins
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow any Vercel preview deployment dynamically
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      // Fallback if no specific origins are set
      if (!allowedOrigins.length) return callback(null, true);
      
      callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use((req: any, res: any, next: any) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  await app.listen(appConfig.port);
}
void bootstrap();
