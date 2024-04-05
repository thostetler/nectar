import { rest } from 'msw';

import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { ApiTargets } from '@/api/models';
import { IADSApiVaultResponse } from '@/api/vault';

export const myadsHandlers = [
  rest.post(apiHandlerRoute(ApiTargets.MYADS_STORAGE, 'query'), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<IADSApiVaultResponse>({
        qid: '012345690',
        numfound: 10,
      }),
    );
  }),
];
