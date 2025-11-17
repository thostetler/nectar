import { http, HttpResponse } from 'msw';

import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { ApiTargets } from '@/api/models';
import { IADSApiReferenceResponse } from '@/api/reference/types';

export const referenceHandlers = [
  http.get(apiHandlerRoute(ApiTargets.REFERENCE), ({ params }) => {
    return HttpResponse.json<IADSApiReferenceResponse>({
      resolved: {
        refstring: params.text as string,
        score: '1.0',
        bibcode: '2000A&A...362..333S',
      },
    });
  }),
];
