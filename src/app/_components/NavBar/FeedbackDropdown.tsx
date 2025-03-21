import { usePathname, useRouter } from 'next/navigation';
import { MouseEvent, ReactElement } from 'react';
import { MenuDropdown } from './MenuDropdown';
import { ListType } from './types';
import { isBrowser } from '@/utils/common/guards';

export const feedbackItems = {
  record: {
    id: 'missingrecord',
    path: '/feedback/missingrecord',
    label: 'Missing/Incorrect Record',
  },
  missingreferences: {
    id: 'missingreferences',
    path: '/feedback/missingreferences',
    label: 'Missing References',
  },
  associatedarticles: {
    id: 'associatedarticles',
    path: '/feedback/associatedarticles',
    label: 'Associated Articles',
  },
  general: {
    id: 'general',
    path: '/feedback/general',
    label: 'General Feedback',
  },
};

interface IFeedbackDropdownProps {
  type: ListType;
  onFinished?: () => void;
}

export const FeedbackDropdown = (props: IFeedbackDropdownProps): ReactElement => {
  const { type, onFinished } = props;

  const items = Object.values(feedbackItems);
  const pathname = usePathname();
  const router = useRouter();

  const handleSelect = (e: MouseEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset['id'];
    if (isBrowser()) {
      void router.push(
        `${items.find((item) => id === item.id).path}?from=${encodeURIComponent(
          pathname.replace(/from=[^&]+(&|$)/, ''),
        )}`,
      );

      if (typeof onFinished === 'function') {
        onFinished();
      }
    }
  };

  return <MenuDropdown id="feedback" type={type} label="Feedback" items={items} onSelect={handleSelect} />;
};
