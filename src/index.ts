import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express from 'express';
import type { Express } from 'express';

let cachedApp: Express | null = null;

async function createApp(): Promise<Express> {
  if (cachedApp) return cachedApp;

  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const nest = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn'],
  });

  nest.setGlobalPrefix('api');
  nest.useGlobalPipes(new ValidationPipe({
    whitelist: false,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  nest.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await nest.init();
  cachedApp = expressApp;
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await createApp();
    app(req, res);
  } catch (err) {
    console.error('Bootstrap error:', err);
    res.status(500).json({ error: 'Server initialization failed', detail: String(err) });
  }
}