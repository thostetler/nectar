import { http, HttpResponse } from 'msw';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { ApiTargets } from '@/api/models';

export const objectsHandlers = [
  // on post to objects service, just return the query
  http.post(apiHandlerRoute(ApiTargets.SERVICE_OBJECTS_QUERY), async ({ request }) => {
    const { query } = (await request.json()) as { query: Array<string> };

    return HttpResponse.json({
      query: query.join(' '),
    });
  }),
];
