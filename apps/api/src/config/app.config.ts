import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiration: process.env.JWT_EXPIRATION || '15m',
    refreshExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  },
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  openapi: {
    enabled: process.env.OPENAPI_ENABLED !== 'false',
    path: process.env.OPENAPI_PATH || 'api/docs',
  },
}));