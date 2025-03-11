import { IronSessionData } from 'iron-session';

export const mockSession: IronSessionData = {
  token: {
    access_token: '',
    anonymous: true,
    expires_at: '0',
    username: 'anonymous',
  },
  isAuthenticated: false,
  bot: false,
};
