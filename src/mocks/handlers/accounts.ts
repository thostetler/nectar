import { rest } from 'msw';
import { apiHandlerRoute } from '@/mocks/mockHelpers';

export const accountHandlers = [
  rest.get(apiHandlerRoute('BOOTSTRAP'), (req, res, ctx) => {
    const test = req.url.searchParams.get('test');

    if (test === 'networkerror') {
      return res.networkError('failure');
    } else if (test === 'fail') {
      return res(ctx.status(500, 'Server Error'));
    }

    return res(
      ctx.status(200),
      ctx.cookie('session', 'test-session'),
      ctx.json({
        username: 'anonymous@ads',
        scopes: ['api', 'execute-query', 'store-query'],
        client_id: 'ONsfcxVTNIae5vULWlH7bLE8F6MpIZgW0Bhghzny',
        access_token: '------ mocked token ---------',
        client_name: 'BB client',
        token_type: 'Bearer',
        ratelimit: 1.0,
        anonymous: true,
        client_secret: 'ly8MkAN34LBNDwco3Ptl4tPMFuNzsEzMXGS8KYMneokpZsSYrVgSrs1lJJx7',
        expire_in: '2099-03-22T14:50:07.712037',
        refresh_token: 'BENF2Gu2EXDXreAjzkiDoV7ReXaNisy4j9kn088u',
      }),
    );
  }),
];
