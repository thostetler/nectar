import { http, HttpResponse, delay } from 'msw';

import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { IExportApiParams } from '@/api/export/types';
import { ApiTargets } from '@/api/models';

export const exportHandlers = [
  http.post(apiHandlerRoute(ApiTargets.EXPORT, '/:format'), async ({ request, params }) => {
    const body = (await request.json()) as IExportApiParams;
    const { bibcode, ...restBody } = body;
    const { format } = params;

    const value = { numRecords: bibcode.length, format, ...restBody };

    await delay(200);

    return HttpResponse.json({
      export: `${JSON.stringify(value, Object.keys(value).sort(), 2)}`,
    });
  }),
];
