import { BehaviorSubject, Observable, Subject } from "rxjs";
import { take } from "rxjs/operators";
import { ICollectionDefinition } from "../models/collection-definition.model";
import { ILocalData } from "../models/local-data.model";
import { IServerDataPayload } from "../models/server-data-payload.model";
import { IServerData } from "../models/server-data.model";

export function generateBatches(db: BehaviorSubject<ILocalData>, redundancyFactor: number, clientsConnected: number): Observable<IServerData[]> {
  const batchData = new Subject<IServerData[]>();
  db.pipe(take(1)).subscribe(localData => {
    const totalDataPoints = localData.groupedServerData.map(group => group.data.length).reduce((prev, curr) => prev + curr, 0);
    const numberOfBatchPoints = totalDataPoints * redundancyFactor;
    const actualNumberOfBatchPoints = (numberOfBatchPoints / clientsConnected) > totalDataPoints 
    ? totalDataPoints * clientsConnected 
    : numberOfBatchPoints;
    const duplicationFactor = Math.floor(actualNumberOfBatchPoints / totalDataPoints);

    const dataPoints = localData.groupedServerData.flatMap<IServerDataPayload>(group => group.data.map<IServerDataPayload>(item => (
        {
          collectionName: group.collectionName, 
          id: item.id, 
          payload: item.data,
          timestamp: item.timestamp, 
        }
        )));
    // Duplicate datapoints based on redundancy factor
    let redundantDatapoints = [...dataPoints];
    for (let i = 0; i < duplicationFactor - 1; i++) {
      redundantDatapoints = [...redundantDatapoints, ...dataPoints];
    }

    const collectionDefinitions = localData.groupedServerData.map<ICollectionDefinition>(group => ({name: group.collectionName}));

    // Generate batch for each client
    const batches = new Array<IServerData>();
    for (let i = 0; i < clientsConnected; i++) {
      const numberOfElementsInBatch = Math.floor(redundantDatapoints.length / clientsConnected);
      const start = i * numberOfElementsInBatch;
      const end = i * numberOfElementsInBatch + i * numberOfElementsInBatch;
      const cut = redundantDatapoints.slice(start, end);
      const batch: IServerData = {
        data: cut,
        schemaDefinition: collectionDefinitions,
        serverId: localData.id
      };

      batches.push(batch);
    }

    batchData.next(batches);

  });
  return batchData;
}