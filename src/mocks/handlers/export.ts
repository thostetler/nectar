import { http, HttpResponse, delay } from 'msw';

import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { IExportApiParams } from '@/api/export/types';
import { ApiTargets } from '@/api/models';

export const exportHandlers = [
  http.get(apiHandlerRoute(ApiTargets.EXPORT_MANIFEST, ''), () => {
    return HttpResponse.json({
      bibtex: { label: 'BibTeX', id: 'bibtex', ext: '.bib' },
      bibtexabs: { label: 'BibTeX (ABS)', id: 'bibtexabs', ext: '.bib' },
      ads: { label: 'ADS', id: 'ads', ext: '.txt' },
      endnote: { label: 'EndNote', id: 'endnote', ext: '.enw' },
      procite: { label: 'ProCite', id: 'procite', ext: '.ris' },
      ris: { label: 'RIS', id: 'ris', ext: '.ris' },
      refworks: { label: 'RefWorks', id: 'refworks', ext: '.txt' },
      rss: { label: 'RSS', id: 'rss', ext: '.xml' },
      medlars: { label: 'MEDLARS', id: 'medlars', ext: '.txt' },
      dcxml: { label: 'DC-XML', id: 'dcxml', ext: '.xml' },
      refxml: { label: 'REF-XML', id: 'refxml', ext: '.xml' },
      refabsxml: { label: 'REFABS-XML', id: 'refabsxml', ext: '.xml' },
      aastex: { label: 'AASTeX', id: 'aastex', ext: '.txt' },
      icarus: { label: 'Icarus', id: 'icarus', ext: '.txt' },
      mnras: { label: 'MNRAS', id: 'mnras', ext: '.txt' },
      soph: { label: 'SoPh', id: 'soph', ext: '.txt' },
      votable: { label: 'VOTable', id: 'votable', ext: '.xml' },
      custom: { label: 'Custom Format', id: 'custom', ext: '.txt' },
    });
  }),
  http.post(apiHandlerRoute(ApiTargets.EXPORT, '/:format'), async ({ request, params }) => {
    const body = (await request.json()) as IExportApiParams;
    const { bibcode, ...restBody } = body;
    const { format } = params;

    const value = { numRecords: bibcode.length, format, ...restBody };

    await delay(200);

    return HttpResponse.json({
      export: `${JSON.stringify(value, Object.keys(value).sort(), 2)}`,
    });
  }),
];
