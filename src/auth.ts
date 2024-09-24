import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface User {
    username: string;
    anonymous: boolean;
    token: string;
    expires: string;
  }

  interface Session {
    user: {
      username: string;
      token: string;
    }
  }

}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {}
      },
      authorize: async (credentials) => {

        const user = {
          "username": "anonymous@ads",
          "scopes": [
            "api",
            "execute-query",
            "store-query"
          ],
          "client_id": "Z636RiJG5oU2mrmukf5AI6ior326NDHqWzP5gOP7",
          "access_token": "1V0a0Co8vDCOrn0U2h8Qx47EAPaXFCfk9huNb02k",
          "client_name": "BB client",
          "token_type": "Bearer",
          "ratelimit": 1.0,
          "anonymous": true,
          "client_secret": "0vnegyIit7AI1DjsuKXufkoI8RJQ9egEJux48ycBaCNZB8zqeNTH9lAgT1El",
          "expire_in": "2024-09-25T04:07:51.287158",
          "refresh_token": "KcGEBDwjH3ck6Ft8kv6AhFGgqFknfXhPKZ4BBtvm"
        }

        return Promise.resolve({
          username: user.username,
          anonymous: user.anonymous,
          token: user.access_token,
          expires: user.expire_in
        });
      }
    })
  ],
  callbacks: {
    j
  }
})
