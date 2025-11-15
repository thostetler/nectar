import { http, HttpResponse } from 'msw';

import qs from 'qs';
import faker from '@faker-js/faker';
import { generateFacetResponse } from '@/mocks/generators/facets';
import { clamp, map, range } from 'ramda';
import { api, apiHandlerRoute, highlights_mocks, ids_mocks, ranRange } from '@/mocks/mockHelpers';
import { generateSearchResponse } from '@/mocks/generators/search';
import { ApiTargets } from '@/api/models';
import { FacetField, IADSApiSearchResponse } from '@/api/search/types';

export const searchHandlers = [
  http.get(apiHandlerRoute(ApiTargets.SEARCH), async ({ request }) => {
    const url = new URL(request.url);
    const params = qs.parse(url.search.slice(1));

    if (typeof params.cursorMark === 'string') {
      const rows = parseInt(params.rows as string, 10) ?? 10;
      const numFound = faker.datatype.number({ min: 1, max: 10000 });
      return HttpResponse.json<IADSApiSearchResponse>(
        {
          nextCursorMark: faker.random.alphaNumeric(18),
          response: {
            numFound,
            docs: map(() => ({
              bibcode: api.bibcode(),
            }))(range(0, clamp(1, 100, rows))),
          },
        },
        { status: 200 },
      );
    }

    if (params['json.facet']) {
      const parsed = JSON.parse(params['json.facet'] as string) as Record<string, { prefix: string }>;
      const facets: Record<string, ReturnType<typeof generateFacetResponse>> = {};
      Object.keys(parsed).forEach((id) => {
        facets[id] = generateFacetResponse({
          id: id as FacetField,
          prefix: parsed[id].prefix,
        });
      });

      return HttpResponse.json<IADSApiSearchResponse>(generateSearchResponse({ facets }), { status: 200 });
    }

    // abstract preview
    if (params.fl === 'abstract') {
      return HttpResponse.json<IADSApiSearchResponse>(
        {
          response: {
            numFound: 1,
            docs: [{ abstract: api.abstract() }],
          },
        },
        { status: 200 },
      );
    }

    // default search
    let limitAuthors = -1;
    if (typeof params.fl === 'string') {
      params.fl.split(',').forEach((v) => {
        const mat = /\[fields author=(\d+)]/.exec(v);
        if (mat !== null) {
          limitAuthors = parseInt(mat[1], 10);
        }
      });
    }

    const rows = parseInt(params.rows as string, 10) ?? 10;
    const numFound = faker.datatype.number({ min: 1, max: 10000 });

    const match = (params.q as string).includes('identifier:(')
      ? /identifier:\((.*?)\)/g.exec(params.q as string)
      : null;
    const ids = match ? match[1].split(' OR ') : [];

    const docs = map((i) => {
      const authorCount = ranRange(limitAuthors > 0 ? limitAuthors + 1 : 0, 1000);
      const citationCount = faker.datatype.number({ min: 0, max: 10000 });
      const referenceCount = faker.datatype.number({ min: 0, max: 10000 });
      const bibcode = ids.length > 0 ? ids.pop() : api.bibcode();
      return {
        bibcode,
        id: ids_mocks[i as number],
        author: map(api.author)(limitAuthors > 0 ? range(0, limitAuthors) : authorCount),
        author_count: authorCount.length,
        bibstem: map(api.bibstem)(ranRange(0, 10)),
        pubdate: api.pubdate(),
        title: [api.title()],
        esources: api.esources(),
        property: api.property(),
        citation_count: citationCount,
        citation_count_norm: Math.random(),
        '[citations]': {
          num_references: referenceCount,
          num_citations: citationCount,
        },
        orcid_pub: map(api.orcidPub)(limitAuthors > 0 ? range(0, limitAuthors) : authorCount),
        aff: map(api.aff)(limitAuthors > 0 ? range(0, limitAuthors) : authorCount),
        abstract: api.abstract(),
        identifier: [bibcode],
      };
    })(range(0, clamp(1, 100, rows)));

    const body: IADSApiSearchResponse = {
      response: {
        numFound,
        docs,
      },
      highlighting: highlights_mocks,
    };

    return HttpResponse.json<IADSApiSearchResponse>(body, { status: 200 });
  }),

  http.post(apiHandlerRoute(ApiTargets.BIGQUERY), async ({ request }) => {
    const bibcodes = await request.text();
    const url = new URL(request.url);
    const rows = Number(url.searchParams.get('rows'));
    const authors = range(0, 5).map(() => `${faker.name.lastName()}, ${faker.random.alpha(1)}.`);
    const results = bibcodes
      .split('\n')
      .slice(1)
      .map((b) => ({
        bibcode: b,
        author: authors,
        author_count: authors.length,
        bibstem: [faker.random.alphaNumeric(5)],
        id: faker.random.alphaNumeric(5),
        identifier: [faker.random.alphaNumeric(10)],
        pub: faker.lorem.words(3),
        pubdate: '2019-03-00',
        title: [faker.lorem.sentence(5)],
        esources: ['PUB_PDF'],
        property: ['ESOURCE', 'NONARTICLE', 'NOT REFEREED', 'OPENACCESS', 'PUB_OPENACCESS', 'TOC'],
        citation_count: faker.datatype.number(100),
        citation_count_norm: 0.0,
        '[citations]': {
          num_references: faker.datatype.number(100),
          num_citations: faker.datatype.number(100),
        },
      }));

    return HttpResponse.json({
      response: {
        numberFound: rows,
        docs: results.slice(0, rows),
      },
    });
  }),
];
