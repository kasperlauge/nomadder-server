import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { ICollectionDefinition } from '../models/collection-definition.model';
import { ILocalData } from '../models/local-data.model';
import { EventTypes, INomadderEvent, NOMADDER_PROTOCOL } from '../models/nomadder-event.model';
import { IServerDataPayload } from '../models/server-data-payload.model';
import { IServerData } from '../models/server-data.model';

export function generateBatches(db: ILocalData, redundancyFactor: number, clientsConnected: number): IServerData[] {
  const localData = db;
  const totalDataPoints = localData.groupedServerData
    .map(group => group.data.length)
    .reduce((prev, curr) => prev + curr, 0);
  const numberOfBatchPoints = totalDataPoints * redundancyFactor;
  const actualNumberOfBatchPoints =
    numberOfBatchPoints / clientsConnected > totalDataPoints ? totalDataPoints * clientsConnected : numberOfBatchPoints;
  const duplicationFactor = Math.floor(actualNumberOfBatchPoints / totalDataPoints);
  // tslint:disable: no-console
  console.log('flat map ? ', localData.groupedServerData);
  console.log('clients: ', clientsConnected);
  const dataPoints = localData.groupedServerData
    .map(group =>
      group.data.map<IServerDataPayload>(item => ({
        collectionName: group.collectionName,
        id: item.id,
        payload: item.data,
        timestamp: item.timestamp,
      })),
    )
    .flat(1);
  console.log('Datapoints: ', JSON.stringify(dataPoints));
  // Duplicate datapoints based on redundancy factor
  let redundantDatapoints = [...dataPoints];
  for (let i = 0; i < duplicationFactor - 1; i++) {
    redundantDatapoints = [...redundantDatapoints, ...dataPoints];
  }

  const collectionDefinitions = localData.groupedServerData.map<ICollectionDefinition>(group => ({
    name: group.collectionName,
  }));

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
      serverId: localData.id,
    };

    batches.push(batch);
  }

  return batches;
}

export function generateBatchEvents(batches: IServerData[]): INomadderEvent[] {
  return batches.map(
    b =>
      ({
        event: EventTypes.BATCH,
        payload: {
          data: b,
          hash: generateHash(b),
        },
        protocol: NOMADDER_PROTOCOL,
      } as INomadderEvent),
  );
}

export function generateHash(data: any) {
  // TODO: Implement
  return '123';
}
