import { Static, Type } from '@sinclair/typebox';
import envSchema from 'env-schema';
import path from 'node:path';

enum NodeEnv {
  development = 'development',
  production = 'production',
  test = 'test',
}

export enum LogLevel {
  debug = 'debug',
  info = 'info',
  warn = 'warn',
  error = 'error',
}

const schema = Type.Object({
  LOG_LEVEL: Type.Enum(LogLevel, { default: LogLevel.info }),
  NODE_ENV: Type.Enum(NodeEnv, { default: NodeEnv.production }),
  HOST: Type.String({ default: 'localhost' }),
  PORT: Type.Number({ default: 8000 }),
});

const env = envSchema<Static<typeof schema>>({
  dotenv: {
    path: path.resolve(__dirname, '../../.env.local'),
    debug: true
  },
  schema,
});

export default {
  nodeEnv: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === NodeEnv.development,
  isProduction: env.NODE_ENV === NodeEnv.production,
  version: process.env.npm_package_version ?? '0.0.0',
  log: {
    level: env.LOG_LEVEL,
  },
  server: {
    host: env.HOST,
    port: env.PORT,
  },
};
