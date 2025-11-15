import { http, HttpResponse, delay } from 'msw';

import { apiHandlerRoute } from '@/mocks/mockHelpers';
import resolverAllResponse from '../responses/resolver/all.json';
import { ApiTargets } from '@/api/models';

export const resolverHandlers = [
  http.get<{ bibcode: string; link_type: string }>(
    apiHandlerRoute(ApiTargets.RESOLVER, '/:bibcode/:link_type'),
    async ({ params }) => {
      await delay(200);
      return HttpResponse.json(
        {
          ...resolverAllResponse,
          __test__: {
            params: params,
          },
        },
        { status: 200 },
      );
    },
  ),
];
