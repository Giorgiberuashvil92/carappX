import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';

async function bootstrap() {
  console.log('🚀 Starting CarAppX Backend Server...');
  console.log('📅 Server start time:', new Date().toISOString());
  
  const app = await NestFactory.create(AppModule);
  console.log('✅ NestJS application created successfully');

  // ავტომატურად განვსაზღვრავთ environment-ს
  const isProduction = process.env.NODE_ENV === 'production';
  console.log('🌍 Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');

  if (isProduction) {
    // Production კონფიგურაცია
    app.enableCors({
      origin: [
        'https://carappx-backend.onrender.com', // Render backend
        'https://carappx.vercel.app', // Frontend
        'https://your-domain.com', // შენი production domain
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });
    console.log('🌍 Production mode - CORS configured for production domains');
  } else {
    // Development კონფიგურაცია
    app.enableCors({
      origin: [
        'http://localhost:8081',
        'http://localhost:3000',
        'http://192.168.1.100:8081', // მობილური device-ის IP
        'http://172.20.10.4:8081', // შენი კომპის IP
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });
    console.log('🔧 Development mode - CORS configured for local development');
  }

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(
    `🚀 Server running on port ${port} in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`,
  );
}
bootstrap();
