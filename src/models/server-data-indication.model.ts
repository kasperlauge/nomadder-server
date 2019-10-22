import { IServerDataPayload } from './server-data-payload.model';

export interface IServerDataIndication {
  serverId: any;
  data: IServerDataPayload[];
  timestamp: string;
  redundancyIndex: number;
}
