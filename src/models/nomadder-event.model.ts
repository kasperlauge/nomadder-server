import { IRefreshEventPayload } from './refresh-event-payload.model';
import { ISyncEventPayload } from './sync-event-payload.model';

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
