import { rest } from 'msw';
import { apiHandlerRoute } from '@/mocks/mockHelpers';

export const objectsHandlers = [
  // on post to objects service, just return the query
  rest.post(apiHandlerRoute('SERVICE_OBJECTS_QUERY'), async (req, res, ctx) => {
    const { query }: { query: Array<string> } = await req.json();

    return res(
      ctx.json({
        query: query.join(' '),
      }),
    );
  }),
];
