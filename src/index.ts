import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { IConfig, IConfigParameters } from './models/config.model';
import { FilePersistanceStrategy } from './models/file-persistance-strategy.model';
import { ILocalData } from './models/local-data.model';
import { EventTypes, INomadderEvent, NOMADDER_PROTOCOL } from './models/nomadder-event.model';
import { ISyncEventPayload } from './models/sync-event-payload.model';
import { generateBatches, generateBatchEvents } from './util/batch-managing.util';
import { extractNew, hydrateData, verifyIntegrity } from './util/data-comparer.util';

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
    config.serverId = new Date().getTime(); // TODO: stupid way to generate an ID - It could be a hash of the MAC address maybe?
  }
  if (!config.persistenceStrategy) {
    config.persistenceStrategy = new FilePersistanceStrategy({});
  }

  const id = config.serverId;

  const db = new BehaviorSubject<ILocalData>({ id, groupedServerData: [] });
  hydrateData(db, config.persistenceStrategy);

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

      switch (msg.event) {
        case EventTypes.SYNC:
          const payload = msg.payload as ISyncEventPayload;
          if (verifyIntegrity(payload)) {
            extractNew(payload.data, db)
              .pipe(take(1))
              // tslint:disable-next-line: no-empty
              .subscribe(_ => {});
          }
          break;
        default:
          /*tslint:disable-next-line:no-console*/
          console.error('[Unknown event type]: ', msg.event);
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
    const batches = generateBatches(localData, redundancyFactor, numberOfClientsConnected);
    console.log("Batches: ", JSON.stringify(batches));
    const batchEvents = generateBatchEvents(batches);
    console.log("clients: ", JSON.stringify(wss.clients));
    wss.clients.forEach(c => c.send(JSON.stringify(batchEvents)));
  });

  return true;
}
