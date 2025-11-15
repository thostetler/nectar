import { http, HttpResponse } from 'msw';

import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { IADSApiMetricsParams } from '@/api/metrics/types';
import { ApiTargets } from '@/api/models';

export const metricsHandlers = [
  http.post<IADSApiMetricsParams>(apiHandlerRoute(ApiTargets.SERVICE_METRICS), async () => {
    return HttpResponse.json(await import('../responses/metrics.json'), { status: 200 });
  }),
];
