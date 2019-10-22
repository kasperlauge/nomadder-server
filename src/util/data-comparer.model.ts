import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { ICollectionDefinition } from '../models/collection-definition.model';
import { IData } from '../models/data.model';
import { IGroupedServerData } from '../models/grouped-server-data.model';
import { ILocalData } from '../models/local-data.model';
import { IServerDataIndication } from '../models/server-data-indication.model';
import { IServerDataInfo } from '../models/server-data-info.model';
import { IServerDataItem } from '../models/server-data-item.model';
import { IServerData } from '../models/server-data.model';
import { ISyncEventPayload } from '../models/sync-event-payload.model';

export function extractNew(
  data: IData,
  db: BehaviorSubject<ILocalData>,
  schemaDefinition: ICollectionDefinition[],
): Observable<IServerDataIndication[]> {
  const serverDataIndication = new Subject<IServerDataIndication[]>();
  db.pipe(take(1)).subscribe(localData => {
    const serverDataInfos = localData.serverDataInfo;
    const newServerData: IServerDataIndication[] = [];
    data.serverData.forEach(serverData => {
      const redundancyIndex = 0;
      const similarIndex = serverDataInfos.findIndex(s => s.serverId === serverData.serverId);
      const similar = serverDataInfos[similarIndex];
      // If we already have the data, and the timestamp is newer or the same then it isn't new data
      if (similar) {
        if (new Date(similar.timestamp) >= new Date(serverData.timestamp)) {
          similar.redundancyIndex++;
        } else {
          const sd = { ...serverData, redundancyIndex } as IServerDataIndication;
          similar.redundancyIndex = 0;
          similar.timestamp = serverData.timestamp;
          newServerData.push(sd);
        }
      } else {
        const sd = { ...serverData, redundancyIndex } as IServerDataIndication;
        newServerData.push(sd);
      }
    });
    const newInfo = newServerData
      .filter(n => n.redundancyIndex === 0)
      .map(n => ({
        redundancyIndex: n.redundancyIndex,
        serverId: n.serverId,
        timestamp: n.timestamp,
      })) as IServerDataInfo[];

    // Remove potential duplicates which are both in newInfo and serverDataInfos
    const serverDataFlattened = serverDataInfos.filter(sdi => {
      const isInNewInfo = newInfo.findIndex(ni => ni.serverId === sdi.serverId) !== -1;
      return !isInNewInfo;
    });
    // Handle the data saved
    const localDb = saveNewData(localData, newServerData, schemaDefinition);
    // Append server data stored about other servers
    const localDbWithServerData = Object.assign({}, localDb, { serverDataInfo: [...serverDataFlattened, ...newInfo] });
    db.next(localDbWithServerData);
    serverDataIndication.next(newServerData);
  });
  return serverDataIndication.asObservable();
}

export function verifyIntegrity(payload: ISyncEventPayload) {
  // This method should verify that the data has not been tampered with using the hash on
  // the payload
  return true;
}

export function hydrateData(localData: BehaviorSubject<ILocalData>) {
  // TODO: Add data based on local cache
  return;
}

export function saveNewData(
  db: ILocalData,
  newServerData: IServerData[],
  schemaDefinition: ICollectionDefinition[],
): ILocalData {
  const collectionsToAdd = findCollectionsToAdd(db, schemaDefinition);
  const localDb = addCollections(db, collectionsToAdd);
  const groupedData = groupData(newServerData);
  const finalLocalDb = upsertGroupedData(localDb, groupedData);
  return finalLocalDb;
}

export function findCollectionsToAdd(
  db: ILocalData,
  schemaDefinition: ICollectionDefinition[],
): ICollectionDefinition[] {
  return schemaDefinition.filter(sd => db.groupedServerData.findIndex(gsd => gsd.collectionName === sd.name) === -1);
}

export function addCollections(db: ILocalData, collectionsToAdd: ICollectionDefinition[]): ILocalData {
  collectionsToAdd.forEach(c => {
    db.groupedServerData.push({ collectionName: c.name, data: [] });
  });
  return db;
}

export function groupData(newServerData: IServerData[]): IGroupedServerData[] {
  const collections: IGroupedServerData[] = [];
  for (const sd of newServerData) {
    for (const d of sd.data) {
      const colInd = collections.findIndex(c => c.collectionName === d.collectionName);
      if (colInd !== -1) {
        collections[colInd].data.push({ data: d.payload, id: d.id });
      } else {
        collections.push({ collectionName: d.collectionName, data: [{ data: d.payload, id: d.id }] });
      }
    }
  }
  return collections;
}

export function upsertGroupedData(db: ILocalData, groupedData: IGroupedServerData[]): ILocalData {
  groupedData.forEach(gd => {
    // Check to make sure schema fits with data
    const dataGroupIndex = db.groupedServerData.findIndex(gds => gds.collectionName === gd.collectionName);
    if (dataGroupIndex !== -1) {
      const dataGroup = db.groupedServerData[dataGroupIndex];
      gd.data.forEach(sd => upsertSingleItem(sd, dataGroup));
    }
  });
  return db;
}

export function upsertSingleItem(serverDataItem: IServerDataItem, dataGroup: IGroupedServerData) {
  const colInd = dataGroup.data.findIndex(c => c.id === serverDataItem.id);
  if (colInd !== -1) {
    dataGroup.data[colInd] = serverDataItem;
  } else {
    dataGroup.data.push(serverDataItem);
  }
}
