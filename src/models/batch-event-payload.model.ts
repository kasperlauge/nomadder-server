import { IServerData } from './server-data.model';

export interface IBatchEventPayload {
  data: IServerData;
  hash: string;
}
