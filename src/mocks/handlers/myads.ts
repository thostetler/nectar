import { http, HttpResponse } from 'msw';

import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { IADSApiVaultResponse } from '@/api/vault/types';
import { ApiTargets } from '@/api/models';

export const myadsHandlers = [
  http.post(apiHandlerRoute(ApiTargets.MYADS_STORAGE, 'query'), () => {
    return HttpResponse.json<IADSApiVaultResponse>({
      qid: '012345690',
      numfound: 10,
    });
  }),
];
