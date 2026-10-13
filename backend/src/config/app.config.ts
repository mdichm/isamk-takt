import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiration: process.env.JWT_EXPIRATION || '15m',
    refreshExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
}));