import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { http, HttpResponse } from 'msw';
import { omit } from 'ramda';
import allNotifications from '../responses/notifications/all-notifications.json';
import allEntities from '../responses/notifications/notification-entities.json';
import {
  IADSApiAddNotificationParams,
  IADSApiEditNotificationParams,
  IADSApiNotificationsReponse,
  INotification,
} from '@/api/vault/types';
import { ApiTargets } from '@/api/models';

const notifications = [...allNotifications] as IADSApiNotificationsReponse;

const entities = allEntities as { [key in string]: INotification };

export const notificationsHandlers = [
  http.get(apiHandlerRoute(ApiTargets.MYADS_NOTIFICATIONS, '/:id'), ({ params }) => {
    const id = params.id as string;
    return HttpResponse.json([entities[id]]);
  }),

  http.get(apiHandlerRoute(ApiTargets.MYADS_NOTIFICATIONS), () => {
    return HttpResponse.json(notifications);
  }),

  // add
  http.post(
    apiHandlerRoute(ApiTargets.MYADS_NOTIFICATIONS),
    async ({ request }) => {
      const { type, template = null, data = null, classes = [], frequency, name = 'added example' } = await request.json() as IADSApiAddNotificationParams;
      const entity: INotification = {
        id: 7,
        name,
        qid: null,
        type,
        active: true,
        stateful: false,
        frequency: type === 'query' ? frequency : template === 'arxiv' ? 'daily' : 'weekly',
        template: template,
        classes: classes,
        data: data,
        created: '2024-03-06T22:43:36.874097+00:00',
        updated: '2024-03-06T22:43:36.874097+00:00',
      };

      entities['7'] = entity;

      notifications.push(omit(['qid', 'stateful', 'classes'], entity));

      return HttpResponse.json(entity);
    },
  ),

  // edit
  http.put(
    apiHandlerRoute(ApiTargets.MYADS_NOTIFICATIONS, '/:id'),
    async ({ request, params }) => {
      const id = params.id as string;
      const body = await request.json() as IADSApiEditNotificationParams;
      entities[id] = { ...entities[id], ...body };
      const t = notifications.find((n) => n.id === parseInt(id));
      t.data = entities[id].data;
      t.active = entities[id].active;
      t.name = entities[id].name;

      return HttpResponse.json(entities[id]);
    },
  ),

  // del
  http.delete(apiHandlerRoute(ApiTargets.MYADS_NOTIFICATIONS, '/:id'), ({ params }) => {
    const id = params.id as string;
    const index = notifications.findIndex((n) => n.id === parseInt(id));
    notifications.splice(index, 1); // remove
    return HttpResponse.json(notifications);
  }),

  // get queries
  http.get(apiHandlerRoute(ApiTargets.MYADS_NOTIFICATIONS_QUERY), () => {
    return HttpResponse.json([
      {
        q: 'star',
        sort: 'date desc',
      },
      {
        q: 'star',
        sort: 'date desc',
      },
      {
        q: 'star',
        sort: 'date desc',
      },
    ]);
  }),

  http.post(apiHandlerRoute(ApiTargets.MYADS_STORAGE_QUERY), () => {
    return HttpResponse.json({ qid: '12345678', numFound: 1 });
  }),
];
