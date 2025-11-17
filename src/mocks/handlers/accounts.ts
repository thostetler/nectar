import { http, HttpResponse } from 'msw';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { ApiTargets } from '@/api/models';

export const accountHandlers = [
  http.get(apiHandlerRoute(ApiTargets.BOOTSTRAP), ({ request }) => {
    const url = new URL(request.url);
    const test = url.searchParams.get('test');

    if (test === 'networkerror') {
      return HttpResponse.error();
    } else if (test === 'fail') {
      return new HttpResponse(null, { status: 500, statusText: 'Server Error' });
    }

    return HttpResponse.json(
      {
        username: 'anonymous@ads',
        scopes: ['api', 'execute-query', 'store-query'],
        client_id: 'ONsfcxVTNIae5vULWlH7bLE8F6MpIZgW0Bhghzny',
        access_token: '------ mocked token ---------',
        client_name: 'BB client',
        token_type: 'Bearer',
        ratelimit: 1.0,
        anonymous: true,
        client_secret: 'ly8MkAN34LBNDwco3Ptl4tPMFuNzsEzMXGS8KYMneokpZsSYrVgSrs1lJJx7',
        expires_at: '999999999999999999',
        refresh_token: 'BENF2Gu2EXDXreAjzkiDoV7ReXaNisy4j9kn088u',
        given_name: 'Test T.',
        family_name: 'Tester',
      },
      {
        headers: {
          'Set-Cookie': 'session=test-session',
        },
      }
    );
  }),
];
