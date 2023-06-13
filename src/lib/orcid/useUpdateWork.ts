import { AppState, useStore } from '@store';
import { useOrcidUpdateWork } from '@api/orcid';
import { useEffect, useState } from 'react';
import { isOrcidProfileEntry } from '@api/orcid/models';
import { IOrcidProfileEntry } from '@api/orcid/types/orcid-profile';
import { useSearch } from '@api';
import { transformADStoOrcid } from '@lib/orcid/workTransformer';
import { OrcidHookOptions, OrcidMutationOptions } from '@lib/orcid/types';
import { parseAPIError } from '@utils';

const orcidUserSelector = (state: AppState) => state.orcid.user;
export const useUpdateWork = (
  options?: OrcidHookOptions<'updateWork'>,
  mutationOptions?: OrcidMutationOptions<'updateWork'>,
) => {
  const user = useStore(orcidUserSelector);
  const [profileEntry, setProfileEntry] = useState<IOrcidProfileEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  console.log(profileEntry, user, error);

  const { data: searchResult, ...searchQueryState } = useSearch(
    {
      q: `identifier:${profileEntry?.identifier}`,
      fl: [
        'pubdate',
        'abstract',
        'bibcode',
        'alternate_bibcode',
        'pub',
        'doi',
        '[fields doi=1]',
        'author',
        'title',
        '[fields title=1]',
        'doctype',
        'identifier',
      ],
      rows: 0,
    },
    {
      enabled: isOrcidProfileEntry(profileEntry),
      onSettled: () => {
        setProfileEntry(null);
      },
      onError: (error) => setError(parseAPIError(error)),
    },
  );

  const { mutate: updateWork, ...updateQueryState } = useOrcidUpdateWork(
    { user },
    {
      ...options,
      onError: async (error, ...args) => {
        if (typeof options.onError === 'function') {
          await options.onError(error, ...args);
        }
        setError(parseAPIError(error));
      },
    },
  );

  useEffect(() => {
    if (searchResult?.numFound > 0) {
      const doc = searchResult?.docs?.[0];
      if (doc) {
        updateWork({ work: transformADStoOrcid(doc) }, mutationOptions);
      }
    }
  }, [searchResult]);

  return {
    updateWork: setProfileEntry,
    searchQueryState,
    updateQueryState,
    error,
  };
};
