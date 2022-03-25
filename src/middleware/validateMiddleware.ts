import { NextFunction } from 'express';
import { ResultFactory, ValidationChain } from 'express-validator';
import { NextApiRequest, NextApiResponse } from 'next';

export const validateMiddleware = (validations: ValidationChain[], validationResult: ResultFactory<unknown>) => {
  return async (req: NextApiRequest, res: NextApiResponse, next: NextFunction): Promise<unknown> => {
    await Promise.all(validations.map(async (validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
      return;
    }

    res.status(422).json({ errors: errors.array() });
  };
};
