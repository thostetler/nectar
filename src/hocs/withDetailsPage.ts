import { fetchSearch, getAbstractParams, searchKeys } from '@api';
import { AppState } from '@store';
import { normalizeURLParams } from '@utils';
import axios from 'axios';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { dehydrate, QueryClient } from 'react-query';

export const withDetailsPage = async (
  ctx: GetServerSidePropsContext,
): Promise<GetServerSidePropsResult<Record<string, unknown>>> => {
  const query = normalizeURLParams<{ id: string }>(ctx.query);

  // primary request for this page is search for the bibcode from url
  try {
    // we want to cache this result, for subsequent client-side requests
    const queryClient = new QueryClient();
    const params = getAbstractParams(query.id);
    const primaryResult = await queryClient.fetchQuery({
      queryKey: searchKeys.abstract(query.id),
      queryFn: fetchSearch,
      meta: { params },
    });

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
        dehydratedAppState: {
          docs: {
            doc: primaryResult.response.docs[0].bibcode,
          },
        } as AppState,
        id: query.id,
      },
    };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) {
      return {
        props: {
          error: {
            status: e.response.status,
            message: e.message,
          },
        },
      };
    }
    return {
      props: {
        error: {
          status: 500,
          message: 'Unknown server error',
        },
      },
    };
  }
};
