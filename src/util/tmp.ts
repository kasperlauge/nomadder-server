// import { BehaviorSubject, Subject } from 'rxjs';
// import { take } from 'rxjs/operators';
// import { IConfig, IConfigParameters } from '../models/config.model';
// import { FilePersistanceStrategy } from '../models/file-persistance-strategy.model';
// import { ILocalData } from '../models/local-data.model';
// import { EventTypes, INomadderEvent, NOMADDER_PROTOCOL } from '../models/nomadder-event.model';
// import { ISyncEventPayload } from '../models/sync-event-payload.model';
// import { generateBatches, generateBatchEvents } from '../util/batch-managing.util';
// import { extractNew, hydrateData } from '../util/data-comparer.util';
// import { verifyIntegrity } from '../util/general.util';

// // const config = { ...configuration } as IConfigParameters;

// export function sendSingleClientData(){

// }

// export function sendBroadcastData(configuration: IConfig){

//     const config = { ...configuration } as IConfigParameters;
//     const wss = config.websocket;
//     // Continuesly announce changes to clients
//     const numberOfClientsConnected = wss.clients.size;
//     const redundancyFactor = config.redundancyFactor;
//     const redundancyLimit = config.redundancyLimit;
//     const batches = generateBatches(localData, redundancyFactor, numberOfClientsConnected, redundancyLimit);
//     config.keySource().then(key => {
//       const batchEvents = generateBatchEvents(batches, key);
//       let i = 0;
//       console.log("Writing to clients")
//       wss.clients.forEach(c => c.send(JSON.stringify(batchEvents[i++])));
//     });
// }