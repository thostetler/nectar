import { SolrSort } from '@/api/models';
import { IADSApiSearchParams } from '@/api';
import { isPlainObject } from 'ramda-adjunct';
import { propIs } from 'ramda';
import { NumPerPageType } from '@/types';
import { APP_DEFAULTS } from '@/config';

// detects if passed in value is a valid SolrSort
export const isSolrSort = (maybeSolrSort: string): maybeSolrSort is SolrSort => {
  return ['author_count asc',
    'author_count desc',
    'bibcode asc',
    'bibcode desc',
    'citation_count asc',
    'citation_count desc',
    'citation_count_norm asc',
    'citation_count_norm desc',
    'classic_factor asc',
    'classic_factor desc',
    'first_author asc',
    'first_author desc',
    'date asc',
    'date desc',
    'entry_date asc',
    'entry_date desc',
    'id asc',
    'id desc',
    'read_count asc',
    'read_count desc',
    'score asc',
    'score desc',
  ].includes(maybeSolrSort);
};

export const isNumPerPageType = (value: number): value is NumPerPageType => {
  return APP_DEFAULTS.PER_PAGE_OPTIONS.includes(value as NumPerPageType);
};
export const isIADSSearchParams = (value: unknown): value is IADSApiSearchParams => {
  return isPlainObject(value) && propIs(String, 'q', value);
};
