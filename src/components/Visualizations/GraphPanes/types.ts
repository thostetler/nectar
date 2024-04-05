import { IADSApiAuthorNetworkNodeKey, IADSApiPaperNetworkNodeKey } from '@/api/vis';

export interface IView {
  id: string;
  label: string;
  valueToUse: IADSApiPaperNetworkNodeKey | IADSApiAuthorNetworkNodeKey;
}
