import { BehaviorSubject, timer } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { IConfig, IConfigParameters } from './models/config.model';
import { FilePersistanceStrategy } from './models/file-persistance-strategy.model';
import { ILocalData } from './models/local-data.model';
import { EventTypes, INomadderEvent, NOMADDER_PROTOCOL } from './models/nomadder-event.model';
import { IServerData } from './models/server-data.model';
import { ISyncEventPayload } from './models/sync-event-payload.model';
import { extractNew, hydrateData, verifyIntegrity } from './util/data-comparer.model';

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
  if (!config.persistenceStrategy) {
    config.persistenceStrategy = new FilePersistanceStrategy({});
  }

  const db = new BehaviorSubject<ILocalData>({ serverDataInfo: [], groupedServerData: [] });
  hydrateData(db, config.persistenceStrategy);

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

      switch (msg.event) {
        case EventTypes.SYNC:
          const payload = msg.payload as ISyncEventPayload;
          // tslint:disable-next-line: no-console
          console.log('Payload: ', JSON.stringify(payload));
          if (verifyIntegrity(payload)) {
            extractNew(payload.data, db, payload.schemaDefinition)
              .pipe(take(1))
              .subscribe(processedData => {
                processedData.forEach(data => {
                  if (data.redundancyIndex >= config.redundancyLimit) {
                    // Do something to indicate that a client can delete this data
                  }
                });

                const newData = processedData
                  .filter(d => d.redundancyIndex < config.redundancyLimit)
                  .map(d => ({ data: d.data, serverId: d.serverId, timestamp: d.timestamp } as IServerData));
                // tslint:disable-next-line: no-console
                console.log('New Data: ', JSON.stringify(processedData));
                // config.persistenceStrategy.persistNewData(newData, payload.schemaDefinition);
              });
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
  db.asObservable().subscribe(localData => {
    config.persistenceStrategy.persistData(localData);
  });

  return true;
}
