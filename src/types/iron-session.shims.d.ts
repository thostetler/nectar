declare module 'iron-session' {
  interface IronSessionData {
    sessionId?: string; // Redis session ID for session store lookup
    token?: {
      access_token: string;
      anonymous: boolean;
      expires_at: string;
      username: string;
    };
    isAuthenticated?: boolean;
    apiCookieHash?: string;
    bot?: boolean;
  }
}
export {};
