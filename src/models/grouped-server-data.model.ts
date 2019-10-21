import { IServerDataItem } from './server-data-item.model';

export interface IGroupedServerData {
  collectionName: string;
  data: IServerDataItem[];
}
