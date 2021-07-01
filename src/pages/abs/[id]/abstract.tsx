import AdsApi, { IADSApiBootstrapData, IDocsEntity, SolrSort } from '@api';
import { AbstractSideNav, AbstractSources } from '@components';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { LinkIcon } from '@heroicons/react/solid';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { isNil } from 'ramda';
import React from 'react';
import { normalizeURLParams } from 'src/utils';

export interface IAbstractPageProps {
  doc?: IDocsEntity;
  error?: Error;
}

const AbstractPage: NextPage<IAbstractPageProps> = (props) => {
  const { doc, error } = props;

  return (
    <section className="flex space-x-2">
      <Head>
        <title>{doc.title}</title>
      </Head>
      <AbstractSideNav doc={doc} />
      <section aria-labelledby="title" className="flex-1 my-8 px-4 py-8 w-full bg-white shadow sm:rounded-lg">
        <div className="pb-1">
          <h2 className="prose-xl text-gray-900 font-medium leading-6" id="title">
            {doc.title}
          </h2>
          <section className="prose-sm text-gray-700">{doc.author.join('; ')}</section>
          <a
            href="#sources"
            className="inline-flex items-center px-2.5 py-1.5 text-gray-700 text-xs font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded focus:outline-none shadow-sm focus:ring-indigo-500 focus:ring-offset-2 focus:ring-2"
          >
            <LinkIcon className="mr-1 w-3 h-3" /> Jump to links
          </a>
        </div>
        {isNil(doc.abstract) ? (
          <section className="prose-lg p-3">No Abstract</section>
        ) : (
          <section className="prose-lg p-3" dangerouslySetInnerHTML={{ __html: doc.abstract }}></section>
        )}
        <article aria-labelledby="sources">
          <Divider label="Sources" />
          <AbstractSources doc={doc} />
        </article>
        <article aria-labelledby="export">
          <Divider label="Export" />
          <h3 className="sr-only" id="export">
            export
          </h3>
          <div className="grid gap-1 grid-cols-12 sm:px-6 sm:py-5 md:gap-4">
            <Link
              href={{ pathname: '/abs/[id]/exportcitation/[export]', query: { id: doc.bibcode, export: 'bibtex' } }}
            >
              <a className="inline-flex col-span-2 items-center px-2.5 py-1.5 text-gray-700 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded focus:outline-none shadow-sm focus:ring-indigo-500 focus:ring-offset-2 focus:ring-2">
                BibTeX
              </a>
            </Link>
            <Link href={{ query: { id: doc.bibcode } }}>
              <a className="inline-flex col-span-2 items-center px-2.5 py-1.5 text-gray-700 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded focus:outline-none shadow-sm focus:ring-indigo-500 focus:ring-offset-2 focus:ring-2">
                ADS
              </a>
            </Link>
            <Link href={{ query: { id: doc.bibcode } }}>
              <a className="inline-flex col-span-2 items-center px-2.5 py-1.5 text-gray-700 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded focus:outline-none shadow-sm focus:ring-indigo-500 focus:ring-offset-2 focus:ring-2">
                BibTeX ABS
              </a>
            </Link>
            <Link href={{ query: { id: doc.bibcode } }}>
              <a className="inline-flex col-span-2 items-center px-2.5 py-1.5 text-gray-700 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded focus:outline-none shadow-sm focus:ring-indigo-500 focus:ring-offset-2 focus:ring-2">
                EndNote
              </a>
            </Link>
            <Link href={{ query: { id: doc.bibcode } }}>
              <a className="inline-flex col-span-2 items-center px-2.5 py-1.5 text-gray-700 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded focus:outline-none shadow-sm focus:ring-indigo-500 focus:ring-offset-2 focus:ring-2">
                Procite
              </a>
            </Link>
            <Link href={{ query: { id: doc.bibcode } }}>
              <a className="inline-flex col-span-2 items-center px-2.5 py-1.5 text-gray-700 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded focus:outline-none shadow-sm focus:ring-indigo-500 focus:ring-offset-2 focus:ring-2">
                Other
              </a>
            </Link>
          </div>
        </article>
        <Details doc={doc} />
      </section>
    </section>
  );
};

export default AbstractPage;

interface IDetailsProps {
  doc: IDocsEntity;
}
const Details = ({ doc }: IDetailsProps) => {
  const entries = [
    { label: 'Publication', value: doc.pub },
    { label: 'Publication Date', value: doc.pubdate },
    { label: 'DOI', value: doc.doi },
    { label: 'Bibcode', value: doc.bibcode },
    { label: 'Keywords', value: doc.keyword },
    { label: 'E-Print Comments', value: doc.comment },
  ];

  return (
    <article>
      <Divider label="Details" />
      <div className="mt-2 bg-white border border-gray-100 rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:p-0">
          <dl className="sm:divide-gray-200 sm:divide-y">
            {entries.map(({ label, value }) => {
              if (typeof value !== 'string') {
                return null;
              }

              return (
                <div key={label} className="py-4 sm:grid sm:gap-4 sm:grid-cols-3 sm:px-6 sm:py-5">
                  <dt className="text-gray-500 text-sm font-medium">{label}</dt>
                  <dd className="mt-1 text-gray-900 text-sm sm:col-span-2 sm:mt-0">
                    {Array.isArray(value) ? value.join('; ') : value}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </article>
  );
};

const Divider = ({ label }: { label: string }) => (
  <div className="relative">
    <div className="absolute inset-0 flex items-center" aria-hidden="true">
      <div className="w-full border-t border-gray-300" />
    </div>
    <div className="relative flex justify-start">
      <span className="pr-3 text-gray-900 text-lg font-medium bg-white">{label}</span>
    </div>
  </div>
);

export const getServerSideProps: GetServerSideProps<IAbstractPageProps> = async (ctx) => {
  const query = normalizeURLParams(ctx.query);
  const request = ctx.req as typeof ctx.req & {
    session: { userData: IADSApiBootstrapData };
  };
  const userData = request.session.userData;
  const params = {
    q: `identifier:${query.id}`,
    fl: [
      ...abstractPageNavDefaultQueryFields,
      'bibcode',
      'title',
      'author',
      '[fields author=3]',
      'author_count',
      'pubdate',
      'abstract',
      'doi',
      'data',
      'keyword',
      'pub',
      'comment',
      'esources',
      'property',
    ],
    sort: query.sort ? (query.sort.split(',') as SolrSort[]) : [],
  };
  const adsapi = new AdsApi({ token: userData.access_token });
  const result = await adsapi.search.query(params);

  if (result.isErr()) {
    return { props: { error: result.error } };
  }

  const doc = result.value.docs[0];
  return {
    props: {
      doc,
    },
  };
};
