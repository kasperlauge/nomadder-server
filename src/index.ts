import { BehaviorSubject, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { IConfig, IConfigParameters } from './models/config.model';
import { FilePersistanceStrategy } from './models/file-persistance-strategy.model';
import { ILocalData } from './models/local-data.model';
import { EventTypes, INomadderEvent, NOMADDER_PROTOCOL } from './models/nomadder-event.model';
import { ISyncEventPayload } from './models/sync-event-payload.model';
import { generateBatches, generateBatchEvents } from './util/batch-managing.util';
import { extractNew, hydrateData } from './util/data-comparer.util';
import { verifyIntegrity } from './util/general.util';

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

  const id = config.serverId;

  db = new BehaviorSubject<ILocalData>({ id, groupedServerData: [] });
  hydrateData(db, config.persistenceStrategy, id);

  const wss = config.websocket;
  wss.addListener('connection', ws => {
    // tslint:disable: no-console

    // wss.clients.forEach(client => {
    //   client.
    // });
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
      switch (msg.protocolInformation.event) {
        case EventTypes.SYNC:
          const payload = msg.protocolInformation.payload as ISyncEventPayload;
          extractNew(payload.data, db)
            .pipe(take(1))
            // tslint:disable-next-line: no-empty
            .subscribe(_ => {});
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
    console.log('Batches: ', JSON.stringify(batches));
    const batchEvents = generateBatchEvents(batches);
    console.log('clients: ', JSON.stringify(wss.clients));
    let i = 0;
    wss.clients.forEach(c => c.send(JSON.stringify(batchEvents[i++])));
  });

  return true;
}

export function getDb(): BehaviorSubject<ILocalData> {
  return db;
}

export { getCollection } from './data-access/data-access.util';
