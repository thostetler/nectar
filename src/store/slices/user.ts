import { IUserData } from '@api';
import { StoreSlice } from '@store';

export interface IAppStateUserSlice {
  user: IUserData;
  userSettings: Record<string, unknown>;

  resetUser: () => void;
}

const defaultUserData: IAppStateUserSlice['user'] = {
  username: undefined,
  anonymous: undefined,
  access_token: undefined,
  expire_in: undefined,
};

export const userSlice: StoreSlice<IAppStateUserSlice> = (set) => ({
  user: defaultUserData,
  userSettings: {},

  resetUser: () => set({ user: defaultUserData, userSettings: {} }, false, 'user/reset'),
});
