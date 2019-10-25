import { IGroupedServerData } from './grouped-server-data.model';
import { IServerDataInfo } from './server-data-info.model';

export interface ILocalData {
  id: any;
  groupedServerData: IGroupedServerData[];
}
