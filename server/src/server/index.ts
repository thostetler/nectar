import next from 'next';
import { fastifyRequestContext } from '@fastify/request-context';
import Cors from '@fastify/cors';
import Helmet from '@fastify/helmet';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import UnderPressure from '@fastify/under-pressure';
import { FastifyInstance } from 'fastify';
import path from 'node:path';
import env from '@/config/env';
import { existsSync, readFileSync } from 'fs';
import NextJsCatchAll from '@/server/routes/nextjs';

const configPath = path.resolve(__dirname, '../required-server-files.json');

export default async function createServer(fastify: FastifyInstance) {
  // Set sensible default security headers
  await fastify.register(Helmet, {
    global: true,
  });

  // Enables the use of request context
  await fastify.register(fastifyRequestContext);

  // Enables the use of CORS in a Fastify application.
  // https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
  await fastify.register(Cors, { origin: false, });


  await fastify.register(UnderPressure);

  const nextjs = next({
    dev: process.env.NODE_ENV !== 'production',
    customServer: true,
    port: env.server.port,
    httpServer: fastify.server,
    hostname: env.server.host,
  });

  if (process.env.NODE_ENV !== 'development') {
    if (existsSync(configPath)) {
      try {
        const output = JSON.parse(readFileSync(configPath, 'utf8'));
        process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(output?.config);
      } catch (err) {
        fastify.log.error({ err }, 'Error reading required-server-files.json');
        process.exit(1);
      }
    }
  }
  fastify.decorate('nextjs', nextjs);
  await nextjs.prepare();

  // plugins

  // routes
  await fastify.register(NextJsCatchAll);

  return fastify.withTypeProvider<TypeBoxTypeProvider>();
}
