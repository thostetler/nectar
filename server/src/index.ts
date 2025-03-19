import { env } from '@/config';
import server from '@/server';
import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';

async function init() {
  const fastify = Fastify({
    logger: { level: env.log.level, },
    requestIdHeader: 'request-id',
    genReqId: function (req) {
      // header best practice: don't use "x-" https://www.rfc-editor.org/info/rfc6648 and keep it lowercase
      return (req.headers['request-id'] as string) ?? randomUUID();
    },
    ignoreDuplicateSlashes: true,
  });

  // initialize server
  await server(fastify);

  try {
    await fastify.listen({ port: env.server.port });
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

void init();

// const configPath = path.resolve(__dirname, '../required-server-files.json');
// const envSchema= {
//   type: 'object',
//   required: ['PORT'],
//   properties: {
//     PORT: {
//       type: 'string',
//       default: 8000,
//     },
//   },
//   "$schema": "http://json-schema.org/draft-07/schema#"
// } satisfies JSONSchema;
//
// type Env = FromSchema<typeof envSchema>;
//
// export default class App {
//   public app: FastifyInstance;
//   public nextjs: ReturnType<typeof next>;
//   public env: Env;
//   public port: number;
//
//   constructor() {
//     this.app = Fastify({
//       keepAliveTimeout: 60000,
//       logger: true,
//     }).withTypeProvider<TypeBoxTypeProvider>();
//     this.app.register(fastifyEnv, { schema: envSchema, dotenv: { path: path.resolve(__dirname, '../../.env.local') } });
//     this.nextjs = next({});
//     this.env = {};
//     this.port = 8000
//   }
//
//   public async listen() {
//     try {
//       this.app.listen({ port: this.port });
//     } catch (err) {
//       this.app.log.error(err);
//       process.exit(1);
//     }
//   }
//
//   public prepare(): Promise<void> {
//     return new Promise((resolve) => {
//       this.app.ready(async (err) => {
//         if (err) {
//           this.app.log.error(err);
//           process.exit(1);
//         }
//         this.env = this.app.getEnvs<Env>();
//         this.port = Number(this.env.PORT);
//
//         this.nextjs = next({
//           dev: process.env.NODE_ENV !== 'production',
//           customServer: true,
//           port: this.port,
//           httpServer: this.app.server,
//           hostname: '0.0.0.0',
//         });
//         this.init();
//
//         if (process.env.NODE_ENV !== 'development') {
//           if (fs.existsSync(configPath)) {
//             try {
//               const output = JSON.parse(fs.readFileSync(configPath, 'utf8'));
//               process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(output?.config);
//             } catch (err) {
//               this.app.log.error({ err }, 'Error reading required-server-files.json');
//               process.exit(1);
//             }
//           }
//         }
//
//         await this.nextjs.prepare();
//         return resolve();
//       })
//     })
//   }
//
//   public getServer() {
//     return this.app;
//   }
//
//   private init() {
//     this.initializePlugins();
//     this.initializeRoutes();
//     this.initializeErrorHandling();
//     this.initializeNextJS();
//   }
//
//   private initializeNextJS() {
//     this.app.all('*', (req, reply) => {
//       return this.nextjs.getRequestHandler()(req.raw, reply.raw);
//     });
//   }
//
//   private initializePlugins() {
//     // this.app.register(fastifyCors, { origin: ORIGIN, credentials: CREDENTIALS === 'true' });
//     // this.app.register(fastifyHelmet);
//     // this.app.register(fastifyCompress);
//     // this.app.register(fastifyJwt, { secret: SECRET_KEY ?? '' });
//     // this.app.register(authentication);
//     // this.app.register(initSwagger);
//   }
//
//   private initializeRoutes() {
//     // this.app.register(initializeRoutes, { prefix: `api/${API_VERSION}` });
//   }
//
//   private initializeErrorHandling() {
//     // this.app.setErrorHandler((error: FastifyError, request, reply) => {
//     //   const status: number = error.statusCode ?? 500;
//     //   const message: string = status === 500 ? 'Something went wrong' : error.message ?? 'Something went wrong';
//     //
//     //   this.app.log.error(`[${request.method}] ${request.url} >> StatusCode:: ${status}, Message:: ${message}`);
//     //
//     //   return reply.status(status).send({ error: true, message });
//     // });
//   }
// }
