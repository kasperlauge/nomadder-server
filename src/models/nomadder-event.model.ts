import { IData } from './data.model';
import { IServerData } from './server-data.model';

export enum EventTypes {
  SYNC = 'SYNC',
  REFRESH = 'REFRESH',
}

export type ProtocolType = 'NOMADDER';

export const NOMADDER_PROTOCOL: ProtocolType = 'NOMADDER';

export interface INomadderEvent {
  protocol: ProtocolType;
  event: EventTypes;
  payload: ISyncEventPayload | IRefreshEventPayload;
}

export interface ISyncEventPayload {
  data: IData;
}

export interface IRefreshEventPayload {
  serverData: IServerData;
}
