import { http, HttpResponse } from 'msw';

export const userHandlers = [
  http.get('*/api/user', ({ request }) => {
    const url = new URL(request.url);
    const test = url.searchParams.get('test');

    if (test === 'networkerror') {
      return HttpResponse.error();
    } else if (test === 'fail') {
      return new HttpResponse(null, { status: 500, statusText: 'Server Error' });
    }

    return HttpResponse.json(
      {
        user: {
          access_token: 'test',
          expires_at: '9999999999999999',
          anonymous: false,
          username: 'test',
        },
        isAuthenticated: true,
      },
      {
        headers: {
          'Set-Cookie': 'session=test-session',
        },
      }
    );
  }),
];
