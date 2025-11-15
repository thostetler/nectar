import { http, HttpResponse } from 'msw';
import orcidNameResponse from '../responses/orcid/orcid-name.json';
import orcidWorksPostResponse from '../responses/orcid/orcid-works_post.json';
import orcidWorksGetResponse from '../responses/orcid/orcid-works_get.json';
import orcidWorksPutResponse from '../responses/orcid/orcid-works_put.json';
import orcidProfileResponse from '../responses/orcid/orcid-profile_full.json';
import orcidExchangeTokenResponse from '../responses/orcid/exchangeOAuthCode.json';
import orcidPreferencesResponse from '../responses/orcid/orcid-preferences.json';
import { IOrcidProfile, IOrcidWork } from '@/api/orcid/types';
import { path } from 'ramda';
import { api, apiHandlerRoute } from '@/mocks/mockHelpers';
import { ApiTargets } from '@/api/models';

let profile: IOrcidProfile = orcidProfileResponse as IOrcidProfile;
const getId = path(['external-ids', 'external-id', '0', 'external-id-value']);
const knownEntry = profile['2022BAAS...54b.022A'];

export const orcidHandlers = [
  http.post(apiHandlerRoute(ApiTargets.ORCID_WORKS), async ({ request }) => {
    const { bulk: works } = (await request.json()) as { bulk: { work: IOrcidWork }[] };

    const entries = works.map(({ work }) => {
      const id = getId(work);
      return [id, { ...knownEntry, putcode: api.putcode(), identifier: id }];
    });

    profile = { ...profile, ...Object.fromEntries(entries) } as IOrcidProfile;

    return HttpResponse.json(orcidWorksPostResponse);
  }),
  http.delete(apiHandlerRoute(ApiTargets.ORCID_WORKS, '/:putcode'), ({ params }) => {
    const putcode = Number(params.putcode);

    let found = null;
    for (const id in profile) {
      if (profile[id]?.putcode === putcode) {
        found = id;
        break;
      }
    }
    if (found) {
      delete profile[found];
    }

    return HttpResponse.json({});
  }),
  http.put(apiHandlerRoute(ApiTargets.ORCID_WORKS), () => HttpResponse.json(orcidWorksPutResponse)),
  http.get(apiHandlerRoute(ApiTargets.ORCID_WORKS), () => HttpResponse.json(orcidWorksGetResponse)),
  http.get(apiHandlerRoute(ApiTargets.ORCID_PROFILE), () => HttpResponse.json(profile)),
  http.get(apiHandlerRoute(ApiTargets.ORCID_NAME), () => HttpResponse.json(orcidNameResponse)),
  http.get(apiHandlerRoute(ApiTargets.ORCID_EXCHANGE_TOKEN), () => HttpResponse.json(orcidExchangeTokenResponse)),
  http.get(apiHandlerRoute(ApiTargets.ORCID_PREFERENCES), () => HttpResponse.json(orcidPreferencesResponse)),

  // passes incoming preferences as response
  http.post(apiHandlerRoute(ApiTargets.ORCID_PREFERENCES), async ({ request }) =>
    HttpResponse.json(await request.json()),
  ),
];
