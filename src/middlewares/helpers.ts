import { IncomingMessage } from "http";

export const getHeader = (headers: Headers | IncomingMessage['headers'], name: string): string => {
  const value: string | Array<string> = headers instanceof Headers ? headers.get(name) : headers?.[name];

  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export const getIp = (req: Request | IncomingMessage) => {
  if (!req) {
    return '127.0.0.1';
  }

  return getHeader(req.headers, 'X-Original-Forwarded-For')
    || getHeader(req.headers, 'X-Forwarded-For')
    || getHeader(req.headers, 'X-Real-Ip')
    || '127.0.0.1';
}
