import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('sdkljf', request.body);
  return Promise.resolve(NextResponse.json({}));
}
