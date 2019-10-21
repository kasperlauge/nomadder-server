import { IGroupedServerData } from './grouped-server-data.model';
import { IServerDataInfo } from './server-data-info.model';

export interface ILocalData {
  serverDataInfo: IServerDataInfo[];
  groupedServerData: IGroupedServerData[];
}
