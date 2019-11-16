import { BehaviorSubject, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { IConfig, IConfigParameters } from './models/config.model';
import { FilePersistanceStrategy } from './models/file-persistance-strategy.model';
import { IIdentityEventPayload } from './models/identity-event-payload.model';
import { ILocalData } from './models/local-data.model';
import { EventTypes, INomadderEvent, NOMADDER_PROTOCOL } from './models/nomadder-event.model';
import { IServerDataItem } from './models/server-data-item.model';
import { ISyncEventPayload } from './models/sync-event-payload.model';
import { generateBatches, generateBatchEvents } from './util/batch-managing.util';
import { extractNew, hydrateData } from './util/data-comparer.util';
import { verifyIntegrity } from './util/general.util';
import { 
  generateIdentityEvent,
  getCollectionItem, 
} from './util/identity.util';

// tslint:disable: no-console
let db: BehaviorSubject<ILocalData>;

export function setup(configuration: IConfig) {
  const config = { ...configuration } as IConfigParameters;
  if (!config) {
    throw new Error("No config defined, there should be a config object specified for method 'setup(IConfig)'");
  }
  if (!config.websocket) {
    throw new Error(
      "No websocket server defined, there should be a websocket server object specified for config object 'setup(IConfig)'",
    );
  }
  if (!config.fileLocation) {
    config.fileLocation = '.';
  }
  if (!config.redundancyLimit) {
    config.redundancyLimit = 3;
  }
  if (!config.redundancyFactor) {
    config.redundancyFactor = 3;
  }
  if (!config.serverId) {
    config.serverId = new Date().getTime();
  }
  if (!config.persistenceStrategy) {
    config.persistenceStrategy = new FilePersistanceStrategy({});
  }
  if (!config.keySource) {
    config.keySource = () => Promise.resolve("Not very secret");
  }

  const id = config.serverId;

  db = new BehaviorSubject<ILocalData>({ id, groupedServerData: [] });
  hydrateData(db, config.persistenceStrategy, id);

  const wss = config.websocket;
  wss.addListener('connection', ws => {
    ws.addListener('message', message => {
      // Parse message data
      let msg = null;
      try {
        msg = JSON.parse(message as string) as INomadderEvent;
      } catch {
        // If it is not JSON it has nothing to do with this protocol
        return;
      }
      // Ensure right protocol
      if (msg.protocol !== NOMADDER_PROTOCOL) {
        return;
      }

      // Verify the integrity of the data sent
      if (!verifyIntegrity(msg.protocolInformation, msg.hash)) {
        return;
      }
      // Verify correct event format
      if (!msg.protocolInformation.event) {
        return;
      }
      let payload: any = null;
      switch (msg.protocolInformation.event) {
        case EventTypes.SYNC:
          payload = msg.protocolInformation.payload as ISyncEventPayload;
          extractNew(payload.data, db)
            .pipe(take(1))
            // tslint:disable-next-line: no-empty
            .subscribe(_ => {});
          break;
        case EventTypes.IDENTITY:
          console.log("Registered Identity event");
          payload = msg.protocolInformation.payload as IIdentityEventPayload;
          getCollectionItem(payload.id, payload.collection)
          .pipe(take(1))
          .subscribe(item => {
            config.keySource().then(key => {
              console.log("Got key");
              const event = generateIdentityEvent(item as IServerDataItem, key, config.serverId, payload.collection);
              console.log("Created event: ", event);
              ws.send(JSON.stringify(event));
            });
          });
          break;
        default:
          /*tslint:disable-next-line:no-console*/
          console.error('[Unknown event type]: ', msg.protocolInformation.event);
          break;
      }
    });
  });

  // Continuesly cache data
  db.asObservable().subscribe((localData: ILocalData) => {
    config.persistenceStrategy.persistData(localData);
    // Continuesly announce changes to clients
    const numberOfClientsConnected = wss.clients.size;
    const redundancyFactor = config.redundancyFactor;
    const redundancyLimit = config.redundancyLimit;
    const batches = generateBatches(localData, redundancyFactor, numberOfClientsConnected, redundancyLimit);
    config.keySource().then(key => {
      const batchEvents = generateBatchEvents(batches, key);
      let i = 0;
      wss.clients.forEach(c => c.send(JSON.stringify(batchEvents[i++])));
    });
  });

  return true;
}

export function getDb(): BehaviorSubject<ILocalData> {
  return db;
}

export { getCollection, upsertDataPoint } from './data-access/data-access.util';
