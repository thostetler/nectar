import { BasicMsg, IAuthHooksOptions } from '@hooks/auth/types';
import { useEffect, useState } from 'react';
import api, { isUserData } from '@api';
import { AppState, useStore, useStoreApi } from '@store';
import axios from 'axios';
import { ITokenPayload } from '@pages/api/auth/token';

const resetUserSelector = (state: AppState) => state.resetUser;

export const useChangeToken = (options: IAuthHooksOptions<BasicMsg<string>> = {}) => {
  const resetUser = useStore(resetUserSelector);
  const storeApi = useStoreApi();
  const [result, setResult] = useState<BasicMsg<string>>(null);

  const changeToken = async () => {
    try {
      const { data } = await axios.post<ITokenPayload>('/api/auth/token');

      if (data.success && isUserData(data.user)) {
        resetUser();
        api.reset();
        storeApi.setState({ user: data.user });
        return setResult({ ok: true });
      } else if (data.error) {
        return setResult({ ok: false, error: data.error });
      }
      setResult({ error: 'Unable to submit request, please try again later', ok: false });
    } catch (e) {
      setResult({ error: 'Unable to submit request, please try again later', ok: false });
    }
  };

  useEffect(() => {
    if (options.enabled) {
      void changeToken();
    }
  }, [options.enabled]);

  return {
    result,
  };
};
