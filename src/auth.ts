import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const { auth, handlers } = NextAuth({
  providers: [
    CredentialsProvider({
      id: 'login',
      name: 'Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        return Promise.resolve({ id: credentials.email });
      },
    }),
  ],
});
