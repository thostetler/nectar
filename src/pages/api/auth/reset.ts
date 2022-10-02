import type { NextApiRequest, NextApiResponse } from 'next';

export default function (req: NextApiRequest, res: NextApiResponse) {
  req.session = null;

  res.status(200).json({});
}
