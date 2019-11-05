import { Observable, Subject } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { getDb } from '..';
import { IServerDataItem } from '../models/server-data-item.model';

export function getCollection(collectionName: string): Observable<IServerDataItem[]> {
  return getDb()
    .asObservable()
    .pipe(take(1))
    .pipe(map(db => {
      const collection = db.groupedServerData.find(gd => gd.collectionName === collectionName);
      if (collection === undefined) {
        return [] as IServerDataItem[];
      } else {
        return collection.data;
      }
    }));
}

export function upsertDataPoint(collectionName: string, id: any, data: any): Observable<boolean> {
  const done = new Subject<boolean>();
  getDb().asObservable().pipe(take(1)).subscribe(db => {
    const collection = db.groupedServerData.find(gd => gd.collectionName === collectionName);
    if (!collection) {
      done.next(false);
    } else {
      const index = collection.data.findIndex(d => d.id === id);
      if (index === -1) {
        collection.data.push({
          data, 
          id, 
          timestamp: new Date().getTime(), 
          uniqueServerIds: []
        });
      } else {
        collection.data[index].data = data;
        collection.data[index].timestamp = new Date().getTime();
        collection.data[index].uniqueServerIds = [];
      }
      getDb().next(db);
      done.next(true);
    }
  });
  return done;
}