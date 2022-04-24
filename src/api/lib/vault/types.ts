import { IADSApiSearchParams } from '../../../_api/search/types';

export interface IADSApiVaultParams extends Partial<IADSApiSearchParams> {
  bigquery: IADSApiSearchParams['q'];
}

export interface IADSApiVaultResponse {
  qid: string;
}
