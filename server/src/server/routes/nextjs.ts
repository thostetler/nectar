import { FastifyPluginAsync } from 'fastify';
const NextJsCatchAll: FastifyPluginAsync = async function (fastify, opts) {

  const handler = fastify.nextjs.getRequestHandler();

  fastify.get('*', (request, reply) => {
    handler(request.raw, reply.raw);
  });
}
export default NextJsCatchAll;
