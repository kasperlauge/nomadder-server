import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { getCollection } from "../data-access/data-access.util";
import { 
  EventTypes, 
  INomadderEvent,
  NOMADDER_PROTOCOL, 
} from "../models/nomadder-event.model";
import { IServerDataItem } from "../models/server-data-item.model";
import { generateHash } from "./batch-managing.util";

export function getCollectionItem(id: any, collection: string): Observable<IServerDataItem | undefined> {
  return getCollection(collection).pipe(map(c => c.find(i => i.id === id)));
}

export function generateIdentityEvent(item: IServerDataItem, key: string, serverId: any, collection: string): INomadderEvent {
  const pi = {
    event: EventTypes.IDENTITYSYNC,
    payload: {
      data: {
        data: [
          {
            collectionName: collection,
            id: item.id,
            payload: item.data,
            timestamp: item.timestamp
          }
        ],
        schemaDefinition: [],
        serverId,
      }
    },
  };

  return {
    hash: generateHash(pi, key),
    protocol: NOMADDER_PROTOCOL,
    protocolInformation: pi,
  } as INomadderEvent;
}