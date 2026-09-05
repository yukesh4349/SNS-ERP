const isProduction = process.env.NODE_ENV === 'production';
const defaultJwtSecret = 'sns-erp-local-access-secret-change-me';
const defaultRefreshSecret = 'sns-erp-local-refresh-secret-change-me';

const jwtSecret = process.env.JWT_SECRET || defaultJwtSecret;
const refreshSecret = process.env.JWT_REFRESH_SECRET || defaultRefreshSecret;

if (isProduction && (jwtSecret === defaultJwtSecret || refreshSecret === defaultRefreshSecret)) {
  throw new Error(
    'CRITICAL SECURITY ERROR: Default/weak JWT secrets are not allowed in production. Set JWT_SECRET and JWT_REFRESH_SECRET environment variables.',
  );
} else if (!isProduction && (jwtSecret === defaultJwtSecret || refreshSecret === defaultRefreshSecret)) {
  console.warn(
    '[appConfig] WARNING: Using default local JWT secrets. Make sure to set JWT_SECRET and JWT_REFRESH_SECRET in production.',
  );
}

export const appConfig = {
  port: Number(process.env.PORT ?? 5000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3001',
  jwtSecret,
  refreshSecret,
  accessTokenTtlSeconds: Number(process.env.JWT_EXPIRES_IN ?? 60 * 60 * 8),
  refreshTokenTtlSeconds: Number(
    process.env.JWT_REFRESH_EXPIRES_IN ?? 60 * 60 * 24 * 14,
  ),
};

