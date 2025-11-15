import { http, HttpResponse } from 'msw';
import allLibraries from '../responses/library/all-libraries.json';
import allEntities from '../responses/library/library-entities.json';
import allPermissions from '../responses/library/permissions.json';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { uniq } from 'ramda';
import {
  IADSApiLibraryAddAnnotationParams,
  IADSApiLibraryAddParams,
  IADSApiLibraryDocumentParams,
  IADSApiLibraryEditMetaParams,
  IADSApiLibraryEntityResponse,
  IADSApiLibraryOperationParams,
  IADSApiLibraryPermissionResponse,
  IADSApiLibraryPermissionUpdateParams,
  IADSApiLibraryResponse,
  IADSApiLibraryTransferParams,
  IADSApiLibraryUpdateAnnotationParams,
  ILibraryMetadata,
} from '@/api/biblib/types';
import { ApiTargets } from '@/api/models';

const libraries = [...allLibraries] as ILibraryMetadata[];

const permissions = allPermissions as { [key in string]: IADSApiLibraryPermissionResponse };

const entities = allEntities as { [key in string]: IADSApiLibraryEntityResponse };

// get library
export const librariesHandlers = [
  http.get(apiHandlerRoute(ApiTargets.LIBRARIES, '/:id'), ({ params }) => {
    const id = params.id as string;
    return HttpResponse.json(entities[id]);
  }),

  // get libraries
  http.get(apiHandlerRoute(ApiTargets.LIBRARIES), ({ request }) => {
    const url = new URL(request.url);
    const start = url.searchParams.has('start') ? Number(url.searchParams.get('start')) : 0;
    const rows = url.searchParams.has('rows') ? Number(url.searchParams.get('rows')) : libraries.length;
    const sortby = url.searchParams.has('sort')
      ? (url.searchParams.get('sort') as keyof ILibraryMetadata)
      : 'date_last_modified';
    const order = url.searchParams.has('order') ? url.searchParams.get('order') : 'desc';
    const access_type = url.searchParams.has('access_type') ? url.searchParams.get('access_type') : 'all';

    libraries.sort((l1, l2) => (l1[sortby] > l2[sortby] ? 1 : l1[sortby] < l2[sortby] ? -1 : 0));
    if (order === 'desc') {
      libraries.reverse();
    }

    let ret = [...libraries];
    if (access_type == 'owner') {
      ret = libraries.filter((l) => l.permission === 'owner');
    } else if (access_type === 'collaborator') {
      ret = libraries.filter((l) => l.permission !== 'owner');
    }

    const r = {
      libraries: ret.slice(start, start + rows),
      count: ret.length,
    } as IADSApiLibraryResponse;
    return HttpResponse.json(r);
  }),

  // library operation
  http.post<{ id: string }>(apiHandlerRoute(ApiTargets.LIBRARY_OPERATION, '/:id'), async ({ params, request }) => {
    const id = params.id;
    const {
      description,
      libraries: ids,
      action,
      name,
      public: isPublic,
    } = (await request.json()) as IADSApiLibraryOperationParams;

    if (action === 'empty') {
      const l = libraries.find((lib) => lib.id === id);
      l.num_documents = 0;
      return HttpResponse.json({});
    } else if (action === 'copy') {
      const l1 = entities[id];
      const l2 = entities[ids[0]];
      const size = uniq([...l1.documents, ...l2.documents]).length;
      libraries.find((lib) => lib.id === ids[0]).num_documents = size;
      return HttpResponse.json({});
    } else {
      libraries.push({
        name,
        id: '022',
        description,
        num_documents: 0,
        date_created: '2023-12-14T19:37:48.139272',
        date_last_modified: '2023-12-14T19:37:48.139279',
        permission: 'owner',
        public: isPublic,
        num_users: 1,
        owner: 'ads.user.1',
      });

      return HttpResponse.json({
        name,
        id: '022',
        description,
      });
    }
  }),

  // add library
  http.post(apiHandlerRoute(ApiTargets.LIBRARIES), async ({ request }) => {
    const { name, description, public: isPublic, bibcode } = (await request.json()) as IADSApiLibraryAddParams;

    libraries.push({
      name,
      id: '021',
      description,
      num_documents: bibcode ? bibcode.length : 0,
      date_created: '2023-12-14T19:37:48.139272',
      date_last_modified: '2023-12-14T19:37:48.139279',
      permission: 'owner',
      public: isPublic,
      num_users: 1,
      owner: 'ads.user.1',
    });

    return HttpResponse.json(await request.json());
  }),

  // delete library
  http.delete<{ id: string }>(apiHandlerRoute(ApiTargets.DOCUMENTS, '/:id'), async ({ params }) => {
    const id = params.id;
    const index = libraries.findIndex((lib) => lib.id === id);
    libraries.splice(index, 1);

    return HttpResponse.json({});
  }),

  // edit library meta
  http.put<{ id: string }>(apiHandlerRoute(ApiTargets.DOCUMENTS, '/:id'), async ({ params, request }) => {
    const id = params.id;
    const { name, description, public: isPublic } = (await request.json()) as Omit<IADSApiLibraryEditMetaParams, 'id'>;

    const library = libraries.find((l) => l.id === id);
    const entity = entities[id];

    if (name) {
      library.name = name;
      entity.metadata.name = name;
    }

    if (description) {
      library.description = description;
      entity.metadata.description = description;
    }

    if (isPublic) {
      library.public = isPublic;
      entity.metadata.public = isPublic;
    }

    return HttpResponse.json({ name: library.name, description: library.description, public: library.public });
  }),

  //  delete/add documents
  http.post<{ id: string }>(apiHandlerRoute(ApiTargets.DOCUMENTS, '/:id'), async ({ params, request }) => {
    const id = params.id;
    const body = (await request.json()) as null | IADSApiLibraryDocumentParams;

    if (body.action === 'remove') {
      // remove docs
      entities[id].documents = entities[id].documents.filter((bibcode) => body.bibcode.indexOf(bibcode) === -1);
      const removed = entities[id].solr.response.numFound - entities[id].documents.length;
      entities[id].solr.response.docs = entities[id].solr.response.docs.filter(
        ({ bibcode }) => body.bibcode.indexOf(bibcode) === -1,
      );
      entities[id].solr.response.numFound = entities[id].solr.response.docs.length;
      entities[id].metadata.num_documents = entities[id].solr.response.docs.length;
      libraries.find((l) => l.id === id).num_documents = entities[id].solr.response.docs.length;
      return HttpResponse.json({ removed });
    } else {
      // add docs
      entities[id].documents = uniq([...entities[id].documents, ...body.bibcode]);
      const added = entities[id].documents.length - entities[id].solr.response.numFound;
      entities[id].solr.response.docs = entities[id].documents.map((bibcode) => ({ bibcode: bibcode }));
      entities[id].solr.response.numFound = entities[id].solr.response.docs.length;
      entities[id].metadata.num_documents = entities[id].solr.response.docs.length;
      libraries.find((l) => l.id === id).num_documents = entities[id].solr.response.numFound;
      return HttpResponse.json({ added });
    }
  }),

  http.get<{ id: string }>(apiHandlerRoute(ApiTargets.PERMISSIONS, '/:id'), async ({ params }) => {
    const id = params.id;
    return HttpResponse.json(permissions[id]);
  }),

  http.post<{ id: string }>(apiHandlerRoute(ApiTargets.PERMISSIONS, '/:id'), async ({ params, request }) => {
    const id = params.id;
    const { email, permission } = (await request.json()) as IADSApiLibraryPermissionUpdateParams;

    const userPermissions = permissions[id].find((up) => !!up[email]);

    if (userPermissions) {
      // existing user
      if (!permission.admin && !permission.read && !permission.write) {
        // remove user
        permissions[id] = permissions[id].filter((up) => !up[email]);
      } else {
        userPermissions[email] = permission.admin
          ? ['admin']
          : permission.write
          ? ['write']
          : permission.read
          ? ['read']
          : [];
      }
    } else {
      // new user
      permissions[id].push({
        [email]: permission.admin ? ['admin'] : permission.write ? ['write'] : permission.read ? ['read'] : [],
      });
    }

    return HttpResponse.json({});
  }),

  http.post<{ id: string }>(apiHandlerRoute(ApiTargets.LIBRARY_TRANSFER, '/:id'), async ({ params, request }) => {
    const id = params.id;
    const { email } = (await request.json()) as Omit<IADSApiLibraryTransferParams, 'id'>;

    libraries.find((l) => l.id === id).owner = email;
    entities[id].metadata.owner = email;

    return HttpResponse.json({});
  }),

  // add note
  http.post<{ library: string; bibcode: string }>(
    apiHandlerRoute(ApiTargets.LIBRARY_NOTES, '/:library/:bibcode'),
    async ({ params, request }) => {
      const { library, bibcode } = params;
      const { content } = (await request.json()) as Omit<IADSApiLibraryAddAnnotationParams, 'library' | 'bibcode'>;

      entities[library].library_notes.notes[bibcode] = {
        id: '12345',
        content,
        bibcode,
        library_id: library,
        date_created: '2019-04-15T19:03:15.345389',
        date_last_modified: '2019-04-15T19:03:15.345389',
      };

      return HttpResponse.json(await request.json());
    },
  ),

  // update note
  http.put<{ library: string; bibcode: string }>(
    apiHandlerRoute(ApiTargets.LIBRARY_NOTES, '/:library/:bibcode'),
    async ({ params, request }) => {
      const { library, bibcode } = params;
      const { content } = (await request.json()) as Omit<IADSApiLibraryUpdateAnnotationParams, 'library' | 'bibcode'>;

      entities[library].library_notes.notes[bibcode].content = content;

      return HttpResponse.json(await request.json());
    },
  ),

  // delete note
  http.delete<{ library: string; bibcode: string }>(
    apiHandlerRoute(ApiTargets.LIBRARY_NOTES, '/:library/:bibcode'),
    async ({ params, request }) => {
      const { library, bibcode } = params;

      delete entities[library].library_notes.notes[bibcode];

      return HttpResponse.json(await request.json());
    },
  ),
];
