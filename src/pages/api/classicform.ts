import { ClassicformController, RawClassicFormParams } from '@controllers/classicformController';
import { withSentry } from '@sentry/nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default withSentry((req: NextApiRequest, res: NextApiResponse): void => {
  const params = req.body as RawClassicFormParams;
  const classicFormController = new ClassicformController(params);
  const query = classicFormController.getQuery();
  res.redirect(`/search?${query}`);
});
