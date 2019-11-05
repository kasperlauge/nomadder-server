import { IBatchEventPayload } from './batch-event-payload.model';
import { EventTypes } from './nomadder-event.model';
import { ISyncEventPayload } from './sync-event-payload.model';

export interface IProtocolPayload {
  event: EventTypes;
  payload: ISyncEventPayload | IBatchEventPayload;
}
