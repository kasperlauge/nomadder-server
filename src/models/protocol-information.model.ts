import { IBatchEventPayload } from './batch-event-payload.model';
import { IIdentityEventPayload } from './identity-event-payload.model';
import { IIdentitySyncEventPayload } from './identity-sync-event-payload.model';
import { EventTypes } from './nomadder-event.model';
import { ISyncEventPayload } from './sync-event-payload.model';

export interface IProtocolPayload {
  event: EventTypes;
  payload: ISyncEventPayload | IBatchEventPayload | IIdentityEventPayload | IIdentitySyncEventPayload;
}
