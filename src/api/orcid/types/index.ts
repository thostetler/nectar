import type { IOrcidUser } from '@api/orcid/types/orcid-user';
import type { IOrcidProfile } from '@api/orcid/types/orcid-profile';
import type { IOrcidName } from '@api/orcid/types/orcid-name';
import type { IOrcidWork } from '@api/orcid/types/orcid-work';
import { IOrcidPreferences } from '@api/orcid/types/orcid-preferences';

export type { IOrcidWork } from './orcid-work';
export type { IOrcidProfile } from './orcid-profile';
export type { IOrcidUser } from './orcid-user';
export type { IOrcidName } from './orcid-name';

export interface IOrcidResponse {
  exchangeToken: IOrcidUser;
  profile: IOrcidProfile;
  updateWork: IOrcidWork;

  /** orcid does not return a response on delete, so return the status */
  removeWorks: Record<string, PromiseSettledResult<void>>;
  addWorks: Record<string, unknown>;
  name: IOrcidName;
  preferences: IOrcidPreferences;
  getWork: IOrcidWork;
}

export interface IOrcidParams {
  exchangeToken: { code: string };
  profile: { user: IOrcidUser; full?: boolean; update?: boolean };
  removeWorks: { putcodes: IOrcidWork['put-code'][] };
  addWorks: { works: unknown[] };
  getWork: { user: IOrcidUser; putcode: IOrcidWork['put-code'] };
  preferences: { user: IOrcidUser; preferences?: IOrcidPreferences };
  name: { user: IOrcidUser };
}

export interface IOrcidMutationParams {
  updateWork: {
    params: { user: IOrcidUser };
    variables: { putcode: IOrcidWork['put-code'] };
  };
  addWorks: {
    params: { user: IOrcidUser };
    variables: { works: IOrcidWork[] };
  };
  removeWorks: {
    params: { user: IOrcidUser };
    variables: { putcodes: IOrcidWork['put-code'][] };
  };
}