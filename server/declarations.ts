import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import {
  FastifyBaseLogger,
  FastifyInstance,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from 'fastify';

import next from 'next';

declare global {
  // Ensures HTTP request is strongly typed from the schema
  type FastifyRouteInstance = FastifyInstance<
    RawServerDefault,
    RawRequestDefaultExpression<RawServerDefault>,
    RawReplyDefaultExpression<RawServerDefault>,
    FastifyBaseLogger,
    JsonSchemaToTsProvider
  >;
}

declare module '@fastify/request-context' {
  interface RequestContextData {
    requestId: string;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    nextjs: ReturnType<typeof next>;
  }
}
