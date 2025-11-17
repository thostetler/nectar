import { http, HttpResponse } from 'msw';
import defaultBibstems from '@/components/BibstemPicker/defaultBibstems.json';
import { IBibstemOption } from '@/types';

export const bibstemHandlers = [
  http.get(`*/api/bibstems/:term`, ({ params }) => {
    const term = (params.term as string).toLowerCase();
    const values = defaultBibstems.filter(({ value, label }) => {
      const parts = `${value} ${Array.isArray(label) ? label[0] : label}`.toLowerCase().match(/\S+\s*/g);
      if (parts === null) {
        return false;
      }
      return parts.some((v) => v.startsWith(term));
    });
    return HttpResponse.json<IBibstemOption[]>(values);
  }),
];
