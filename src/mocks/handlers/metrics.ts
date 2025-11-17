import { http, HttpResponse } from 'msw';

import { apiHandlerRoute } from '@/mocks/mockHelpers';
// Removed unused import '@/api/metrics/types';
import { ApiTargets } from '@/api/models';

export const metricsHandlers = [
  http.post(apiHandlerRoute(ApiTargets.SERVICE_METRICS), async () => {
    return HttpResponse.json(await import('../responses/metrics.json'));
  }),
];
