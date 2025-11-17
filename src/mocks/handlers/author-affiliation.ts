import { http, HttpResponse } from 'msw';

import { IAuthorAffiliationResponse } from '@/api/author-affiliation/types';
import { flatten, range } from 'ramda';
import { apiHandlerRoute, authorAffData } from '@/mocks/mockHelpers';
import faker from '@faker-js/faker';
import { ApiTargets } from '@/api/models';

export const authorAffiliationHandlers = [
  http.post(apiHandlerRoute(ApiTargets.AUTHOR_AFFILIATION_SEARCH), () => {
    return HttpResponse.json<IAuthorAffiliationResponse>({
      data: [...flatten(range(0, 10).map(() => authorAffData(faker.datatype.number({ min: 1, max: 3 }))))],
    });
  }),

  http.post(apiHandlerRoute(ApiTargets.AUTHOR_AFFILIATION_EXPORT), () => {
    return HttpResponse.json('success');
  }),
];
