import { IServerDataPayload } from './server-data-payload.model';

export interface IServerData {
  serverId: any;
  data: IServerDataPayload[];
  timestamp: string;
}
