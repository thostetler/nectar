import { http, HttpResponse } from 'msw';

import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { ApiTargets } from '@/api/models';
import { IADSApiReferenceResponse } from '@/api/reference/types';

export const referenceHandlers = [
  http.get<{ text: string }>(apiHandlerRoute(ApiTargets.REFERENCE), ({ params }) => {
    return HttpResponse.json<IADSApiReferenceResponse>(
      {
        resolved: {
          refstring: params.text,
          score: '1.0',
          bibcode: '2000A&A...362..333S',
        },
      },
      { status: 200 },
    );
  }),
];
