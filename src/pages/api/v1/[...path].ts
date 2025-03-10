import httpProxy from 'http-proxy';
import { NextApiHandler } from 'next';

const proxy = httpProxy.createProxyServer();

// Make sure that we don't parse JSON bodies on this route:
export const config = {
  api: {
    bodyParser: false,
  },
};

const handler: NextApiHandler = (req, res) => {
  return new Promise((resolve, reject) => {
    proxy.web(req, res, { target: process.env.API_HOST, changeOrigin: true }, (err) => {
      if (err) {
        return reject(err);
      }
      resolve(res);
    });
  });
};

export default handler;
