import * as crypto from "crypto";
import { ICollectionDefinition } from '../models/collection-definition.model';
import { ILocalData } from '../models/local-data.model';
import { EventTypes, INomadderEvent, NOMADDER_PROTOCOL } from '../models/nomadder-event.model';
import { IServerDataPayload } from '../models/server-data-payload.model';
import { IServerData } from '../models/server-data.model';

export function generateBatches(
  db: ILocalData,
  redundancyFactor: number,
  clientsConnected: number,
  redundancyLimit: number,
): IServerData[] {
  const localData = db;
  const totalDataPoints = localData.groupedServerData
    .map(group => group.data.length)
    .reduce((prev, curr) => prev + curr, 0);
  const numberOfBatchPoints = totalDataPoints * redundancyFactor;
  const actualNumberOfBatchPoints =
    numberOfBatchPoints / clientsConnected > totalDataPoints ? totalDataPoints * clientsConnected : numberOfBatchPoints;
  const duplicationFactor = Math.floor(actualNumberOfBatchPoints / totalDataPoints);
  const dataPoints = localData.groupedServerData.flatMap<IServerDataPayload>(group =>
    group.data
      .filter(d => d.uniqueServerIds.length < redundancyLimit)
      .map<IServerDataPayload>(item => ({
        collectionName: group.collectionName,
        id: item.id,
        payload: item.data,
        timestamp: item.timestamp,
      })),
  );
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
    const end = (i + 1) * numberOfElementsInBatch;
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

export function generateBatchEvents(batches: IServerData[], key: string): INomadderEvent[] {
  return batches.map(b => {
      const pi = {
        event: EventTypes.BATCH,
        payload: {
          data: b,
        },
      };

      return {
        hash: generateHash(pi, key),
        protocol: NOMADDER_PROTOCOL,
        protocolInformation: pi,
      } as INomadderEvent;
    }
  );
}

export function generateHash(data: any, key: string) {
  const hmac = crypto.createHmac("sha256", key);
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
}
