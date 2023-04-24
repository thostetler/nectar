import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { IronSession, unsealData } from 'iron-session';
import { sessionConfig } from '@config';
import { ApiTargets } from '@api/models';
import { getAbstractParams } from '@api/search/models';
import { stringifySearchParams } from '@utils';
import { IADSApiSearchResponse, IDocsEntity } from '@api';
import clsx from 'clsx';
import { ChartPieIcon, DocumentDuplicateIcon, FolderIcon, UsersIcon } from '@heroicons/react/24/outline';
import {
  ArrowDownTrayIcon,
  ClipboardIcon,
  DocumentIcon,
  PaintBrushIcon,
  TableCellsIcon,
} from '@heroicons/react/24/solid';

const getAbstract = async (id: string) => {
  const cookie = cookies().get(process.env.SCIX_SESSION_COOKIE_NAME);
  console.log('cookie', cookie);
  if (!cookie) {
    return null;
  }
  const session = await unsealData<IronSession>(cookie.value, sessionConfig);
  console.log('session', session);
  const params = stringifySearchParams({
    ...getAbstractParams(id ?? '2023RvMPP...7...18C'),
    omitHeader: 'true',
    wt: 'json',
    fl: '',
  });
  const url = `${process.env.API_HOST_SERVER}${ApiTargets.SEARCH}?${params.toString()}`;
  console.log(url);
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      authorization: `Bearer:${session?.token?.access_token}`,
    },
  });
  return (await res.json()) as IADSApiSearchResponse;
};

const AbstractPageLayout = async ({ children, params }: { children: ReactNode; params: { id: string } }) => {
  console.log('params', params);
  const doc = await getAbstract(params.id);
  console.log('doc', doc);

  return (
    <div className="flex flex-col my-8 min-h-screen lg:flex-row">
      <SideNav doc={doc?.response?.docs?.[0]} />
      <main className="flex-grow p-8">{children}</main>
    </div>
  );
};

export default AbstractPageLayout;

const SideNav = ({ doc }: { doc: IDocsEntity }) => {
  const navigation = [
    { name: 'Abstract', href: '#', icon: DocumentIcon, count: '5', current: true },
    { name: 'Citations', href: '#', icon: FolderIcon, current: false },
    { name: 'References', href: '#', icon: ClipboardIcon, count: '12', current: false },
    { name: 'Co-Reads', href: '#', icon: UsersIcon, count: '20+', current: false },
    { name: 'Similar Papers', href: '#', icon: DocumentDuplicateIcon, current: false },
    { name: 'Volume Content', href: '#', icon: TableCellsIcon, current: false },
    { name: 'Graphics', href: '#', icon: PaintBrushIcon, current: false },
    { name: 'Metrics', href: '#', icon: ChartPieIcon, current: false },
    { name: 'Export Citation', href: '#', icon: ArrowDownTrayIcon, current: false },
  ];
  return (
    <nav className="flex flex-1 flex-col" aria-label="Sidebar">
      <ul role="list" className="border-rounded -mx-2 border border-gray-100 space-y-1">
        {navigation.map((item) => (
          <li key={item.name}>
            <a
              href={item.href}
              className={clsx(
                item.current ? 'bg-gray-50 text-gray-900' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50',
                'group flex gap-x-3 p-2 text-sm font-semibold leading-6 rounded-md',
              )}
            >
              <item.icon
                className={clsx(
                  item.current ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900',
                  'shrink-0 w-6 h-6',
                )}
                aria-hidden="true"
              />
              {item.name}
              {item.count ? (
                <span
                  className="ml-auto px-2.5 py-0.5 w-9 min-w-max text-center text-gray-600 whitespace-nowrap text-xs font-medium leading-5 bg-white rounded-full ring-1 ring-inset ring-gray-200"
                  aria-hidden="true"
                >
                  {item.count}
                </span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
