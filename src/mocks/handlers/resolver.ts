import { rest } from 'msw';

export const resolverHandlers = [
  rest.get('*resolver/*', async (req, res, ctx) => {
    return res(ctx.status(200), ctx.body(''));
  }),
];
