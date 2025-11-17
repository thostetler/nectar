import { http, HttpResponse } from 'msw';

import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { IExportApiParams } from '@/api/export/types';
import { ApiTargets } from '@/api/models';

export const exportHandlers = [
  http.post(apiHandlerRoute(ApiTargets.EXPORT, '/:format'), async ({ request, params }) => {
    const { bibcode, ...body } = await request.json() as IExportApiParams;
    const { format } = params;

    const value = { numRecords: bibcode.length, format, ...body };

    await new Promise(resolve => setTimeout(resolve, 200));
    return HttpResponse.json({
      export: `${JSON.stringify(value, Object.keys(value).sort(), 2)}`,
    });
  }),
];
