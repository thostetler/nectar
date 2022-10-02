import { useSession } from '@hooks/useSession';
import { isBrowser } from '@utils';
import { useRouter } from 'next/router';
import { MouseEvent, ReactElement } from 'react';
import { MenuDropdown } from './MenuDropdown';
import { ListType } from './types';

export const items = [
  {
    id: 'login',
    path: '/user/account/login',
    label: 'Login',
  },
  {
    id: 'signup',
    path: '/user/account/register',
    label: 'Signup',
  },
];

const loggedInItems = [
  {
    id: 'libraries',
    path: '/user/libraries',
    label: 'My Libraries',
  },
  {
    id: 'settings',
    path: '/user/account/settings',
    label: 'My Settings',
  },
  {
    id: 'logout',
    path: '',
    label: 'Logout',
  },
];

interface IAccountDropdown {
  type: ListType;
  onFinished?: () => void;
}

export const AccountDropdown = (props: IAccountDropdown): ReactElement => {
  const { type, onFinished } = props;
  const { isAuthenticated, logout } = useSession();

  const router = useRouter();

  const handleSelect = (e: MouseEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset['id'];
    if (isBrowser()) {
      if (id === 'logout') {
        void logout();
      }
      const path = (isAuthenticated ? loggedInItems : items).find((item) => id === item.id).path;
      if (path) {
        void router.push(path);
      }
      if (onFinished) {
        onFinished();
      }
    }
  };

  return (
    <MenuDropdown
      id="account"
      type={type}
      label="Account"
      items={isAuthenticated ? loggedInItems : items}
      onSelect={handleSelect}
    />
  );
};
