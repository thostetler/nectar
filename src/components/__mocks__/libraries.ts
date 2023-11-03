import { ILibraryMetadata } from '@api';

export const libraries: ILibraryMetadata[] = [
  {
    name: 'lib-1',
    id: '111',
    description: 'My ADS library',
    num_documents: 0,
    date_created: '2023-09-05T22:12:05.511383',
    date_last_modified: '2023-09-05T22:12:05.511393',
    permission: 'owner',
    public: false,
    num_users: 1,
    owner: 'ads',
  },
  {
    name: 'lib-2',
    id: '222',
    description: 'My ADS library',
    num_documents: 0,
    date_created: '2023-09-05T22:12:29.460672',
    date_last_modified: '2023-09-05T22:12:29.460680',
    permission: 'owner',
    public: false,
    num_users: 1,
    owner: 'ads',
  },
  {
    name: 'lib-3',
    id: '333',
    description: 'silly library',
    num_documents: 3,
    date_created: '2023-09-18T17:46:02.068300',
    date_last_modified: '2023-09-18T18:16:33.668957',
    permission: 'read',
    public: true,
    num_users: 2,
    owner: 'johnny',
  },
  {
    name: 'lib-4',
    id: '444',
    description: 'another silly library',
    num_documents: 505,
    date_created: '2023-09-18T18:24:06.510578',
    date_last_modified: '2023-10-25T16:59:44.352260',
    permission: 'write',
    public: true,
    num_users: 2,
    owner: 'tracy',
  },
  {
    name: 'lib-5',
    id: '555',
    description: 'An ADS library',
    num_documents: 0,
    date_created: '2023-09-22T14:05:34.650827',
    date_last_modified: '2023-09-22T14:05:34.650837',
    permission: 'admin',
    public: false,
    num_users: 2,
    owner: 'amy',
  },
];