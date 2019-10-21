import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { IData } from '../models/data.model';
import { ILocalData } from '../models/local-data.model';
import { IServerDataIndication } from '../models/server-data-indication.model';
import { IServerDataInfo } from '../models/server-data-info.model';
import { ISyncEventPayload } from '../models/sync-event-payload.model';

export function extractNew(data: IData, db: BehaviorSubject<ILocalData>): Observable<IServerDataIndication[]> {
  const serverDataIndication = new Subject<IServerDataIndication[]>();
  db.pipe(take(1)).subscribe(localData => {
    const serverDataInfos = localData.serverDataInfo;
    const newServerData: IServerDataIndication[] = [];
    data.serverData.forEach(serverData => {
      let redundancyIndex = 0;
      const similarIndex = serverDataInfos.findIndex(s => s.serverId === serverData.serverId);
      const similar = serverDataInfos[similarIndex];
      // If we already have the data, and the timestamp is newer or the same then it isn't new data
      if (similar) {
        if (new Date(similar.timestamp) >= new Date(serverData.timestamp)) {
          similar.redundancyIndex++;
          redundancyIndex = similar.redundancyIndex;
        } else {
          similar.redundancyIndex = 0;
        }
        similar.timestamp = serverData.timestamp;
      } else {
        newServerData.push({ ...serverData, redundancyIndex });
      }
    });
    const newInfo = newServerData
      .filter(n => n.redundancyIndex === 0)
      .map(n => ({
        redundancyIndex: n.redundancyIndex,
        serverId: n.serverId,
        timestamp: n.timestamp,
      })) as IServerDataInfo[];
    db.next(Object.assign({}, localData, { serverDataInfo: [...serverDataInfos, ...newInfo] }));
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
