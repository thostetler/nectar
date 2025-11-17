import { http, HttpResponse } from 'msw';

import { apiHandlerRoute } from '@/mocks/mockHelpers';
import resolverAllResponse from '../responses/resolver/all.json';
// Removed unused import '@/api/resolver/types';
import { ApiTargets } from '@/api/models';

export const resolverHandlers = [
  http.get(
    apiHandlerRoute(ApiTargets.RESOLVER, '/:bibcode/:link_type'),
    async ({ params }) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return HttpResponse.json({
        ...resolverAllResponse,
        __test__: {
          params,
        },
      });
    },
  ),
];
